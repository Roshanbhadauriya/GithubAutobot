import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { retryWebhookEvent } from "@/services/webhook-handler";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { logId } = await req.json();
    if (!logId) {
      return Response.json({ error: "Missing logId" }, { status: 400 });
    }

    // 1. Verify ownership of the log entry
    const logEntry = await prisma.webhookLog.findUnique({
      where: { id: logId },
      include: {
        repository: true,
      },
    });

    if (!logEntry || logEntry.repository.userId !== session.userId) {
      return Response.json({ error: "Log entry not found or unauthorized" }, { status: 404 });
    }

    // 2. Trigger the retry process
    const success = await retryWebhookEvent(logId);

    if (!success) {
      return Response.json({ error: "Retry execution failed" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error retrying webhook log:", error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
