import { Worker, Job } from "bullmq";
import { getRedisConnection } from "./services/queue";
import { connectToDb } from "./lib/db";
import { MediaJob } from "./models/MediaJob";
import crypto from "crypto";

// Connect to MongoDB
connectToDb().catch(err => {
  console.error("Worker failed to connect to DB:", err);
  process.exit(1);
});

console.log("🚀 Starting BullMQ Background Worker...");

/**
 * Utility to post to internal webhook securely
 */
async function postToWebhook(payload: any) {
  const secret = process.env.INTERNAL_WORKER_SECRET || "";
  const rawBody = JSON.stringify(payload);
  
  const signature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // In real life, replace with actual backend URL
  // await fetch("http://localhost:3000/api/webhooks/media", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "x-webhook-signature": signature
  //   },
  //   body: rawBody
  // });
}

// ─── Media Worker ────────────────────────────────────────────────────────────

const mediaWorker = new Worker(
  "media-generation",
  async (job: Job) => {
    const { jobId, prompt, modelId } = job.data;
    console.log(`[MediaWorker] Processing job ${jobId} with model ${modelId}`);

    await MediaJob.findByIdAndUpdate(jobId, { status: "running" });

    try {
      await new Promise(res => setTimeout(res, 3000));
      const simulatedUrl = `https://generated-images.friends-ai.com/mock-${Date.now()}.png`;

      await postToWebhook({ jobId, status: "succeeded", resultUrl: simulatedUrl });

      return { resultUrl: simulatedUrl };
    } catch (error: any) {
      console.error(`[MediaWorker] Job ${jobId} failed:`, error);
      
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        await postToWebhook({ 
          jobId, 
          status: "failed", 
          error: { code: "GEN_FAILED", message: error.message } 
        });
      }
      throw error;
    }
  },
  { connection: getRedisConnection() }
);

mediaWorker.on("completed", (job) => {
  console.log(`[MediaWorker] Job ${job.id} completed successfully`);
});

mediaWorker.on("failed", (job, err) => {
  console.error(`[MediaWorker] Job ${job?.id} failed with error:`, err.message);
});

// ─── Moderation Worker ────────────────────────────────────────────────────────
const moderationWorker = new Worker(
  "content-moderation",
  async (job: Job) => {
    const { mediaId, url } = job.data;
    console.log(`[ModerationWorker] Checking media ${mediaId}`);
    
    // In production, this would call Google Vision API or AWS Rekognition
    // to check for NSFW/violating content in the generated image.
    await new Promise(res => setTimeout(res, 1000));
    
    // Simulate moderation pass
    console.log(`[ModerationWorker] Media ${mediaId} passed safety checks.`);
    return { safe: true };
  },
  { connection: getRedisConnection() }
);

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

process.on("SIGINT", async () => {
  console.log("Shutting down workers...");
  await mediaWorker.close();
  await moderationWorker.close();
  await getRedisConnection().quit();
  process.exit(0);
});
