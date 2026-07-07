export interface SlackNotificationParams {
  repoName: string;
  eventType: string;
  action: string;
  author: string;
  title: string;
  url: string;
  aiSummary?: string | null;
  aiPriority?: string | null;
  actionsTaken?: string[];
}

/**
 * Maps event types to emoji + color combinations for rich Slack formatting.
 */
function getEventMeta(eventType: string, action: string) {
  if (eventType === "Issue") {
    return {
      emoji: "🟢",
      verb: action === "opened" ? "opened" : action,
      icon: "📋",
      color: "#2ea043",
    };
  }
  if (eventType === "Pull Request") {
    return {
      emoji: "🟣",
      verb: action === "opened" ? "opened" : action,
      icon: "🔀",
      color: "#8957e5",
    };
  }
  return {
    emoji: "🔵",
    verb: "pushed",
    icon: "📦",
    color: "#388bfd",
  };
}

/**
 * Maps priority levels to emoji indicators.
 */
function getPriorityIndicator(priority: string | null | undefined): string {
  if (!priority) return "⚪ Unknown";
  switch (priority) {
    case "High":
      return "🔴 High";
    case "Medium":
      return "🟡 Medium";
    case "Low":
      return "🟢 Low";
    default:
      return `⚪ ${priority}`;
  }
}

export async function sendSlackNotification(
  customWebhookUrl: string | null | undefined,
  params: SlackNotificationParams
): Promise<boolean> {
  const webhookUrl = customWebhookUrl || process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("Slack webhook URL is not configured. Skipping notification.");
    return false;
  }

  try {
    const meta = getEventMeta(params.eventType, params.action);

    // ── Build Slack Block Kit payload ────────────────────────────
    const blocks: any[] = [
      // Header with emoji
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${meta.icon}  ${params.eventType} ${meta.verb}`,
          emoji: true,
        },
      },
      // Repo + Author context line
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `📁 *<https://github.com/${params.repoName}|${params.repoName}>*  •  👤 *${params.author}*  •  ${meta.emoji} \`${params.action}\``,
          },
        ],
      },
      { type: "divider" },
      // Title as a linked section
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${params.url}|${params.title}>*`,
        },
      },
    ];

    // AI Triage section (if available)
    if (params.aiSummary || params.aiPriority) {
      blocks.push({ type: "divider" });
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "🤖  *AI Triage Analysis*",
        },
      });

      if (params.aiSummary) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `> _${params.aiSummary}_`,
          },
        });
      }

      if (params.aiPriority) {
        blocks.push({
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `*Severity:*  ${getPriorityIndicator(params.aiPriority)}`,
            },
          ],
        });
      }
    }

    // Actions Taken section
    if (params.actionsTaken && params.actionsTaken.length > 0) {
      blocks.push({ type: "divider" });
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `⚡  *Actions Executed*\n${params.actionsTaken
            .map((act) => `    ✓  ${act}`)
            .join("\n")}`,
        },
      });
    }

    // Footer timestamp
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `⏱️ Processed at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>  •  _AutoBot v1.0_`,
        },
      ],
    });

    const payload = {
      text: `${meta.icon} ${params.eventType} ${meta.verb}: ${params.title} — ${params.repoName}`,
      blocks,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Slack API responded with status ${response.status}: ${body}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return false;
  }
}
