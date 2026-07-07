import { Octokit } from "@octokit/rest";
import { prisma } from "@/lib/db";
import { triageGithubEvent } from "./gemini";
import { sendSlackNotification } from "./slack";
import { WebhookPayload } from "@/types";

// Internal helper that performs the actual rule evaluation and action execution
async function executeRulesAndTriage(
  logId: string,
  repo: any, // Repository with user included
  eventType: string,
  payload: WebhookPayload,
  currentRetryCount: number,
  existingAiData: { summary?: string | null; priority?: string | null; labels?: string | null } = {}
) {
  const actionsExecuted: string[] = [];
  let status: "success" | "failed" | "skipped" = "skipped";
  let errorMessage: string | null = null;
  let aiSummary = existingAiData.summary || null;
  let aiPriority = existingAiData.priority || null;
  let aiLabels = existingAiData.labels || null;

  try {
    // 1. Extract common fields based on event type
    let title = "";
    let body = "";
    let author = payload.sender?.login || "unknown";
    let url = payload.repository.html_url;
    let number: number | null = null;
    let action = payload.action || "push";

    if (eventType === "issues" && payload.issue) {
      title = payload.issue.title;
      body = payload.issue.body || "";
      author = payload.issue.user.login;
      url = payload.issue.html_url;
      number = payload.issue.number;
    } else if (eventType === "pull_request" && payload.pull_request) {
      title = payload.pull_request.title;
      body = payload.pull_request.body || "";
      author = payload.pull_request.user.login;
      url = payload.pull_request.html_url;
      number = payload.pull_request.number;
    } else if (eventType === "push") {
      title = `Push to ${payload.ref?.replace("refs/heads/", "") || "repo"}`;
      body = payload.commits?.map((c) => c.message).join("\n") || "";
      author = payload.pusher?.name || payload.sender?.login || "unknown";
      url = payload.compare || payload.repository.html_url;
    }

    // 2. AI Triage if this is a newly opened Issue or PR, and we don't have AI summary yet
    const isNewContent = (eventType === "issues" || eventType === "pull_request") && action === "opened";
    if (isNewContent && !aiSummary) {
      console.log(`Running AI Triage for ${eventType} #${number}`);
      const aiResult = await triageGithubEvent(
        eventType as "issues" | "pull_request",
        title,
        body
      );
      aiSummary = aiResult.summary;
      aiPriority = aiResult.priority;
      aiLabels = aiResult.recommendedLabels.join(",");
      actionsExecuted.push(`AI Triage: Priority=${aiPriority}, Labels=[${aiLabels}]`);
    }

    // 3. Fetch Active Rules (only run rule actions on issue/PR creation or pushes)
    const shouldExecuteRules =
      eventType === "push" ||
      ((eventType === "issues" || eventType === "pull_request") && action === "opened");

    const activeRules = shouldExecuteRules
      ? await prisma.rule.findMany({
          where: {
            userId: repo.userId,
            isActive: true,
            eventType,
          },
        })
      : [];

    console.log(`Evaluating ${activeRules.length} active rules for ${eventType} (action: ${action})`);

    // Octokit client using user credentials
    const octokit = new Octokit({ auth: repo.user.accessToken });

    for (const rule of activeRules) {
      let isMatch = false;

      // Match conditions
      const fieldToCheck = rule.field;
      const matchType = rule.matchType;
      const matchValue = rule.matchValue.toLowerCase();

      let targetText = "";
      if (fieldToCheck === "title") {
        targetText = title;
      } else if (fieldToCheck === "body") {
        targetText = body;
      } else if (fieldToCheck === "author") {
        targetText = author;
      } else if (fieldToCheck === "any") {
        targetText = `${title}\n${body}\n${author}`;
      }

      targetText = targetText.toLowerCase();

      if (matchType === "always" || matchValue === "*" || matchValue === "") {
        isMatch = true;
      } else if (matchType === "contains") {
        isMatch = targetText.includes(matchValue);
      } else if (matchType === "equals") {
        isMatch = targetText === matchValue;
      } else if (matchType === "starts_with") {
        isMatch = targetText.startsWith(matchValue);
      }

      if (isMatch) {
        console.log(`Rule "${rule.name}" MATCHED! Triggering actions.`);
        status = "success"; // If at least one rule matches and executes, status becomes success

        const ruleActionsTaken: string[] = [];

        // Action A: Add Labels
        if (rule.addLabels && number) {
          const labelsToAdd = rule.addLabels
            .split(",")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

          if (labelsToAdd.length > 0) {
            await octokit.issues.addLabels({
              owner: repo.ownerName,
              repo: repo.name,
              issue_number: number,
              labels: labelsToAdd,
            });
            ruleActionsTaken.push(`Added labels: ${labelsToAdd.join(", ")}`);
          }
        }

        // Action B: Post Comment (formatted markdown)
        if (rule.postComment && number) {
          const eventLabel = eventType === "issues" ? "Issue" : "Pull Request";
          const priorityBadge = aiPriority === "High"
            ? "🔴 **High**"
            : aiPriority === "Medium"
            ? "🟡 **Medium**"
            : aiPriority === "Low"
            ? "🟢 **Low**"
            : null;

          let commentBody = `## 🤖 AutoBot\n\n`;
          commentBody += `${rule.postComment}\n\n`;

          // Add AI triage info if available
          if (aiSummary || priorityBadge) {
            commentBody += `---\n\n`;
            commentBody += `<details>\n<summary>📊 <strong>AI Triage Analysis</strong></summary>\n\n`;
            if (aiSummary) {
              commentBody += `> ${aiSummary}\n\n`;
            }
            if (priorityBadge) {
              commentBody += `**Priority:** ${priorityBadge}\n\n`;
            }
            if (aiLabels) {
              const labelList = aiLabels.split(",").map((l) => `\`${l.trim()}\``).join(" ");
              commentBody += `**Suggested Labels:** ${labelList}\n\n`;
            }
            commentBody += `</details>\n\n`;
          }

          commentBody += `<sub>🔧 Automated by <strong>AutoBot</strong> • Rule: <em>${rule.name}</em></sub>`;

          await octokit.issues.createComment({
            owner: repo.ownerName,
            repo: repo.name,
            issue_number: number,
            body: commentBody,
          });
          ruleActionsTaken.push(`Posted comment: "${rule.postComment.slice(0, 30)}..."`);
        }

        // Action C: Send Slack Webhook Notification
        if (rule.sendSlack) {
          const slackSuccess = await sendSlackNotification(rule.slackWebhookUrl, {
            repoName: repo.fullName,
            eventType: eventType === "issues" ? "Issue" : eventType === "pull_request" ? "Pull Request" : "Push",
            action,
            author,
            title,
            url,
            aiSummary,
            aiPriority,
            actionsTaken: ruleActionsTaken,
          });
          ruleActionsTaken.push(slackSuccess ? "Sent Slack alert" : "Failed to send Slack alert");
        }

        actionsExecuted.push(`Rule "${rule.name}": [${ruleActionsTaken.join(" | ")}]`);
      }
    }

    // If no rules matched, set status to skipped
    if (status !== "success") {
      status = "skipped";
      console.log(`No active rules matched this event.`);
    }
  } catch (error: any) {
    console.error("Error executing webhook handler:", error);
    status = "failed";
    errorMessage = error.message || String(error);
  }

  // Update WebhookLog with results
  await prisma.webhookLog.update({
    where: { id: logId },
    data: {
      status,
      actionsTaken: JSON.stringify(actionsExecuted),
      aiSummary,
      aiPriority,
      aiLabels,
      errorMessage,
      retryCount: currentRetryCount,
    },
  });

  console.log(`Webhook processing finished for log: ${logId}. Status: ${status}`);
}

// Main function triggered by incoming webhook requests
export async function processWebhookEvent(
  deliveryId: string,
  eventType: string,
  payload: WebhookPayload
) {
  const repositoryId = payload.repository.id;
  const repoFullName = payload.repository.full_name;

  // Find repository and user credentials
  const repo = await prisma.repository.findUnique({
    where: { githubId: repositoryId },
    include: { user: true },
  });

  if (!repo || !repo.isConnected) {
    console.warn(`Repository ${repoFullName} (${repositoryId}) is not connected. Skipping.`);
    return;
  }

  // Create log in "pending" status
  const logEntry = await prisma.webhookLog.create({
    data: {
      deliveryId,
      eventType,
      action: payload.action || "push",
      repositoryId: repo.id,
      payload: JSON.stringify(payload),
      status: "pending",
      actionsTaken: "[]",
    },
  });

  await executeRulesAndTriage(logEntry.id, repo, eventType, payload, 0);
}

// Function to manual retry a failed webhook log from the dashboard
export async function retryWebhookEvent(logId: string): Promise<boolean> {
  const logEntry = await prisma.webhookLog.findUnique({
    where: { id: logId },
    include: {
      repository: {
        include: { user: true },
      },
    },
  });

  if (!logEntry) {
    console.error(`Log entry ${logId} not found`);
    return false;
  }

  console.log(`Retrying webhook event log: ${logId} (delivery: ${logEntry.deliveryId})`);

  // Update state to pending and increment retry count
  const newRetryCount = logEntry.retryCount + 1;
  await prisma.webhookLog.update({
    where: { id: logId },
    data: {
      status: "pending",
      errorMessage: null,
    },
  });

  const payload = JSON.parse(logEntry.payload) as WebhookPayload;

  // Execute rules again, passing any existing AI triage summaries so we don't query Gemini twice
  await executeRulesAndTriage(
    logEntry.id,
    logEntry.repository,
    logEntry.eventType,
    payload,
    newRetryCount,
    {
      summary: logEntry.aiSummary,
      priority: logEntry.aiPriority,
      labels: logEntry.aiLabels,
    }
  );

  return true;
}
