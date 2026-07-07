import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch logs for all repositories belonging to the authenticated user
    const logs = await prisma.webhookLog.findMany({
      where: {
        repository: {
          userId: session.userId,
        },
      },
      include: {
        repository: true,
      },
      orderBy: {
        processedAt: "desc",
      },
      take: 100, // Limit to recent 100 logs
    });

    // Format BigInt webhookId as string to prevent JSON serialization crash
    const sanitizedLogs = logs.map((log) => ({
      ...log,
      repository: {
        ...log.repository,
        webhookId: log.repository.webhookId ? log.repository.webhookId.toString() : null,
      },
    }));

    return Response.json({ logs: sanitizedLogs });
  } catch (error: any) {
    console.error("Error fetching logs:", error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
