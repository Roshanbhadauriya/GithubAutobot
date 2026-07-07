import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: List all rules for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let rules = await prisma.rule.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    // If user has no rules, seed 3 prebuilt template rules (disabled by default)
    if (rules.length === 0) {
      await prisma.rule.createMany({
        data: [
          {
            name: "Slack Alert on All Issues",
            eventType: "issues",
            field: "any",
            matchType: "always",
            matchValue: "*",
            addLabels: "",
            postComment: null,
            sendSlack: true,
            slackWebhookUrl: null,
            isActive: false,
            isDefault: true,
            userId: session.userId,
          },
          {
            name: "Auto-Label Bug Issues",
            eventType: "issues",
            field: "title",
            matchType: "contains",
            matchValue: "bug",
            addLabels: "bug",
            postComment: "Acknowledged. Triage and bug tracking initiated.",
            sendSlack: false,
            slackWebhookUrl: null,
            isActive: false,
            isDefault: true,
            userId: session.userId,
          },
          {
            name: "Welcome Comment on new PRs",
            eventType: "pull_request",
            field: "any",
            matchType: "always",
            matchValue: "*",
            addLabels: "",
            postComment: "Thanks for opening this pull request! A maintainer will review it shortly.",
            sendSlack: false,
            slackWebhookUrl: null,
            isActive: false,
            isDefault: true,
            userId: session.userId,
          }
        ]
      });

      // Refetch seeded rules
      rules = await prisma.rule.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
      });
    }

    return Response.json({ rules });
  } catch (error: any) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}

// POST: Create a new rule
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      eventType,
      field,
      matchType,
      matchValue,
      addLabels,
      postComment,
      sendSlack,
      slackWebhookUrl,
    } = body;

    if (!name || !eventType || !field || !matchType || matchValue === undefined) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rule = await prisma.rule.create({
      data: {
        name,
        eventType,
        field,
        matchType,
        matchValue,
        addLabels: addLabels || "",
        postComment: postComment || null,
        sendSlack: !!sendSlack,
        slackWebhookUrl: slackWebhookUrl || null,
        userId: session.userId,
      },
    });

    return Response.json({ success: true, rule });
  } catch (error: any) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}

// PUT: Update an existing rule
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return Response.json({ error: "Missing rule ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.rule.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.userId) {
      return Response.json({ error: "Rule not found or unauthorized" }, { status: 404 });
    }

    const rule = await prisma.rule.update({
      where: { id },
      data: {
        name: data.name,
        eventType: data.eventType,
        field: data.field,
        matchType: data.matchType,
        matchValue: data.matchValue,
        addLabels: data.addLabels,
        postComment: data.postComment,
        sendSlack: data.sendSlack !== undefined ? !!data.sendSlack : undefined,
        slackWebhookUrl: data.slackWebhookUrl,
        isActive: data.isActive !== undefined ? !!data.isActive : undefined,
      },
    });

    return Response.json({ success: true, rule });
  } catch (error: any) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}

// DELETE: Delete a rule
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Missing rule ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.rule.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.userId) {
      return Response.json({ error: "Rule not found or unauthorized" }, { status: 404 });
    }

    if (existing.isDefault) {
      return Response.json({ error: "Default rules cannot be deleted. You can only enable or disable them." }, { status: 403 });
    }

    await prisma.rule.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
