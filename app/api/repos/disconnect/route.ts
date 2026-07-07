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

    const { githubId, name, ownerName } = await req.json();
    if (!githubId || !name || !ownerName) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.accessToken) {
      return Response.json({ error: "User or token not found" }, { status: 404 });
    }

    // 1. Find Repository in our DB
    const repository = await prisma.repository.findUnique({
      where: { githubId: Number(githubId) },
    });

    if (!repository) {
      return Response.json({ error: "Repository record not found in database" }, { status: 404 });
    }

    // 2. Delete Webhook on GitHub if it exists
    if (repository.webhookId) {
      const octokit = new Octokit({ auth: user.accessToken });
      try {
        console.log(`Deleting GitHub webhook ID: ${repository.webhookId} for repo ${repository.fullName}`);
        await octokit.repos.deleteWebhook({
          owner: ownerName,
          repo: name,
          hook_id: Number(repository.webhookId),
        });
      } catch (e: any) {
        console.warn("Could not delete webhook from GitHub (it may have been deleted manually):", e);
      }
    }

    // 3. Update database state
    const updatedRepository = await prisma.repository.update({
      where: { githubId: Number(githubId) },
      data: {
        isConnected: false,
        webhookId: null,
      },
    });

    return Response.json({
      success: true,
      repository: {
        ...updatedRepository,
        webhookId: null,
      },
    });
  } catch (error: any) {
    console.error("Error disconnecting repository:", error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
