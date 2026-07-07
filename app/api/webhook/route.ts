import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { processWebhookEvent } from "@/services/webhook-handler";
import { after } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const eventType = req.headers.get("x-github-event");
    const deliveryId = req.headers.get("x-github-delivery");

    if (!signature || !eventType || !deliveryId) {
      return new Response("Missing required GitHub headers", { status: 400 });
    }

    // 1. Verify webhook signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret) {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = "sha256=" + hmac.update(rawBody).digest("hex");
      if (signature !== digest) {
        return new Response("Unauthorized signature mismatch", { status: 401 });
      }
    } else {
      console.warn("GITHUB_WEBHOOK_SECRET is not set. Signature verification bypassed.");
    }

    // 2. Handle ping event from GitHub (sent when webhook is first registered)
    const payload = JSON.parse(rawBody);
    if (eventType === "ping") {
      console.log("Received ping event from GitHub");
      return Response.json({ message: "pong" });
    }

    // 3. Idempotency Check
    const existing = await prisma.webhookLog.findUnique({
      where: { deliveryId },
    });
    if (existing) {
      console.log(`Duplicate event skipped. Delivery ID: ${deliveryId}`);
      return Response.json({ message: "Duplicate event skipped", status: "skipped" });
    }

    // 4. Verify repository connected in DB
    const repoGithubId = payload.repository?.id;
    if (!repoGithubId) {
      return Response.json({ message: "Invalid repository in payload" }, { status: 400 });
    }

    const repo = await prisma.repository.findUnique({
      where: { githubId: repoGithubId },
    });

    if (!repo || !repo.isConnected) {
      // Return 200 OK so GitHub doesn't retry, but log it as skipped
      return Response.json({ message: "Repository not connected", status: "skipped" });
    }

    // 5. Run processing asynchronously AFTER returning response
    after(async () => {
      try {
        await processWebhookEvent(deliveryId, eventType, payload);
      } catch (err) {
        console.error(`Background processing failed for delivery: ${deliveryId}`, err);
      }
    });

    return Response.json({ message: "Webhook accepted", status: "processing" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
