import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Octokit } from "@octokit/rest";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.accessToken) {
      return Response.json({ error: "User or access token not found" }, { status: 404 });
    }

    // Initialize Octokit with user token
    const octokit = new Octokit({ auth: user.accessToken });

    // Fetch user's repositories from GitHub
    const githubRepos = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    // Fetch connected repositories from our database
    const dbRepos = await prisma.repository.findMany({
      where: { userId: user.id },
    });

    const dbReposMap = new Map(dbRepos.map((r) => [r.githubId, r]));

    // Format and merge results
    const repositories = githubRepos.data.map((repo) => {
      const dbRepo = dbReposMap.get(repo.id);
      return {
        githubId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        ownerName: repo.owner.login,
        htmlUrl: repo.html_url,
        description: repo.description,
        isConnected: dbRepo ? dbRepo.isConnected : false,
        id: dbRepo ? dbRepo.id : null,
        defaultBranch: repo.default_branch || "main",
        pushedAt: repo.pushed_at,
        updatedAt: repo.updated_at,
      };
    });

    return Response.json({ repositories });
  } catch (error: any) {
    console.error("Error listing repositories:", error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
