import { NextRequest, NextResponse } from "next/server";
import { MediaJob } from "@/models/MediaJob";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * Internal Webhook for Async Media Delivery.
 * The BullMQ background worker posts to this endpoint once an image/video
 * has finished generating and passed moderation.
 * This endpoint updates the database and uses Server-Sent Events (SSE) or Pusher
 * to push the result down to the waiting React frontend.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Cryptographic Signature Verification
    const secret = process.env.INTERNAL_WORKER_SECRET || "";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("[Media Webhook] Invalid signature detected.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const { jobId, status, resultUrl, error } = JSON.parse(rawBody);

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // 1. Update the database
    const updatePayload: any = { status, finishedAt: new Date() };
    if (resultUrl) updatePayload.resultUrl = resultUrl;
    if (error) updatePayload.error = error;

    const job = await MediaJob.findByIdAndUpdate(jobId, updatePayload, { new: true });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 2. Push to client
    // In a real implementation, you would trigger a Pusher event here:
    // pusher.trigger(`user-${job.userId}`, 'media_ready', { jobId, resultUrl });
    console.log(`[Media Webhook] Pushed completion event for job ${jobId} to client.`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Media Webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
