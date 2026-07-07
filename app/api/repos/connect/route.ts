import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Octokit } from "@octokit/rest";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { githubId, name, fullName, ownerName } = await req.json();
    if (!githubId || !name || !fullName || !ownerName) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.accessToken) {
      return Response.json({ error: "User or token not found" }, { status: 404 });
    }

    const octokit = new Octokit({ auth: user.accessToken });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!appUrl) {
      return Response.json({ error: "NEXT_PUBLIC_APP_URL is not configured" }, { status: 500 });
    }

    // 1. Create Webhook on GitHub Repository
    console.log(`Creating webhook for repository: ${fullName}`);
    const webhookUrl = `${appUrl}/api/webhook`;

    // Before creating, check if we already have a webhook ID in the database.
    // If so, let's try to delete it first to prevent duplicates.
    const existingRepo = await prisma.repository.findUnique({
      where: { githubId: Number(githubId) },
    });

    if (existingRepo && existingRepo.webhookId) {
      try {
        await octokit.repos.deleteWebhook({
          owner: ownerName,
          repo: name,
          hook_id: Number(existingRepo.webhookId),
        });
        console.log(`Deleted existing webhook ID: ${existingRepo.webhookId}`);
      } catch (e) {
        console.warn("Could not delete existing webhook (it might have been deleted on GitHub manually):", e);
      }
    }

    const hook = await octokit.repos.createWebhook({
      owner: ownerName,
      repo: name,
      name: "web",
      active: true,
      events: ["issues", "pull_request", "push"],
      config: {
        url: webhookUrl,
        content_type: "json",
        secret: webhookSecret,
        insecure_ssl: "0",
      },
    });

    const webhookId = hook.data.id;

    // 2. Upsert repository record in our DB and mark as connected
    const repository = await prisma.repository.upsert({
      where: { githubId: Number(githubId) },
      update: {
        isConnected: true,
        webhookId: BigInt(webhookId),
      },
      create: {
        githubId: Number(githubId),
        name,
        fullName,
        ownerName,
        isConnected: true,
        webhookId: BigInt(webhookId),
        userId: user.id,
      },
    });

    // Format BigInt as string for JSON response
    return Response.json({
      success: true,
      repository: {
        ...repository,
        webhookId: repository.webhookId ? repository.webhookId.toString() : null,
      },
    });
  } catch (error: any) {
    console.error("Error connecting repository:", error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
