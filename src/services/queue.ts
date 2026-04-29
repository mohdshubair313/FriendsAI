import { Queue, QueueOptions } from "bullmq";
import Redis from "ioredis";

// Centralized Redis connection instance (Lazy-initialized)
let _redisConnection: Redis | null = null;

export function getRedisConnection() {
  if (!_redisConnection) {
    _redisConnection = new Redis(process.env.VALKEY_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _redisConnection;
}

// Queue configuration options (Lazy)
function getQueueConfig(): QueueOptions {
  return {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 24 * 3600 },
    },
  };
}

// ─── Queues (Lazy-initialized to prevent build-time ECONNREFUSED) ───────────

let _mediaQueue: Queue | null = null;
let _notificationQueue: Queue | null = null;
let _syncQueue: Queue | null = null;
let _moderationQueue: Queue | null = null;

export const getMediaQueue = () => (_mediaQueue ??= new Queue("media-generation", getQueueConfig()));
export const getNotificationQueue = () => (_notificationQueue ??= new Queue("notifications", getQueueConfig()));
export const getSyncQueue = () => (_syncQueue ??= new Queue("data-sync", getQueueConfig()));
export const getModerationQueue = () => (_moderationQueue ??= new Queue("content-moderation", getQueueConfig()));

// ─── Helper Methods ──────────────────────────────────────────────────────────

export async function enqueueImageGeneration(jobId: string, prompt: string, modelId: string) {
  return getMediaQueue().add("generate-image", { jobId, prompt, modelId }, { jobId });
}

export async function enqueueModerationTask(mediaId: string, url: string) {
  return getModerationQueue().add("moderate-media", { mediaId, url });
}

export async function enqueueNotification(userId: string, type: string, payload: any) {
  return getNotificationQueue().add("send-notification", { userId, type, payload });
}
