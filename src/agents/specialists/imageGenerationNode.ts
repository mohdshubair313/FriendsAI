import { State } from "../state";
import { AIMessage } from "@langchain/core/messages";
import { enqueueImageGeneration } from "@/services/queue";
import { MediaJob } from "@/models/MediaJob";
import { UserPreferences } from "@/models/UserPreferences";

const ALLOWED_MODELS = ["flux-pro", "flux-dev", "sdxl-turbo"] as const;
const DEFAULT_MODEL: typeof ALLOWED_MODELS[number] = "flux-pro";
const MAX_PROMPT_LENGTH = 500;

function sanitizePrompt(prompt: string): string {
  return prompt
    .replace(/<script\b[^<]*(?:(?!<script)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/^\/image\s*/i, "")
    .slice(0, MAX_PROMPT_LENGTH)
    .trim();
}

/**
 * Pull an ISO-3166 country code out of a `locale` string like "en-US".
 * Falls back to "US" so the MediaJob schema's required field is always set.
 */
function countryFromLocale(locale: string | undefined): string {
  const part = locale?.split("-")[1]?.toUpperCase();
  return part && part.length === 2 ? part : "US";
}

export async function imageGenerationNode(state: State) {
  const latestMessage = sanitizePrompt(
    state.messages[state.messages.length - 1].content.toString()
  );

  const userId = (state as any).userId;
  const conversationId = (state as any).conversationId;

  if (!userId) {
    return {
      messages: [new AIMessage("Unable to generate image: user not authenticated.")],
      finalResponse: true,
    };
  }
  // The orchestrate route mints a Conversation before invoking the graph,
  // so this should never trip — but guard anyway because MediaJob requires it.
  if (!conversationId) {
    console.error("[ImageGenerationNode] Missing conversationId in state");
    return {
      messages: [
        new AIMessage("I couldn't start the image job — conversation context is missing. Please refresh and try again."),
      ],
      finalResponse: true,
    };
  }

  if (!latestMessage) {
    return {
      messages: [new AIMessage("Tell me what you'd like to see — describe the image and I'll generate it.")],
      finalResponse: true,
    };
  }

  // Pull the user's locale so the generated image can pick region-aware
  // styling later (festivals, fashion, etc). Default to US if missing.
  const prefs = await UserPreferences.findOne({ userId }).lean<{ locale?: string }>().catch(() => null);
  const country = countryFromLocale(prefs?.locale);

  let job: any;
  try {
    job = await MediaJob.create({
      userId,
      conversationId,
      kind: "image",
      prompt: latestMessage,
      modelId: DEFAULT_MODEL,
      status: "queued",
      locale: { country },
    });
  } catch (err: any) {
    console.error("[ImageGenerationNode] MediaJob.create failed:", err?.message || err);
    return {
      messages: [
        new AIMessage(
          "I couldn't record the image job right now. Please try again in a moment."
        ),
      ],
      finalResponse: true,
    };
  }

  // Enqueue with a hard timeout. If Redis/Valkey is unreachable (common
  // in local dev), `bullmq.add()` would otherwise retry forever and the
  // whole HTTP request would hang. We mark the MediaJob as failed and
  // tell the user we'll need to skip — better a clear error than a stuck
  // spinner.
  const ENQUEUE_TIMEOUT_MS = 5000;
  try {
    await Promise.race([
      enqueueImageGeneration(job._id.toString(), latestMessage, DEFAULT_MODEL),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("enqueue_timeout")), ENQUEUE_TIMEOUT_MS)
      ),
    ]);

    return {
      messages: [
        new AIMessage(
          `On it — generating your image now.\n\n_Prompt:_ ${latestMessage}\n_Track progress:_ \`/api/media/status/${job._id}\``
        ),
      ],
      finalResponse: true,
    };
  } catch (err: any) {
    const reason = err?.message === "enqueue_timeout"
      ? "queue_unreachable"
      : err?.code === "ECONNREFUSED"
        ? "queue_unreachable"
        : "enqueue_failed";

    console.error("[ImageGenerationNode] Enqueue failed:", reason, err?.message || err);

    // Best-effort: flag the job so the user can see the failure in the
    // dashboard. Don't await indefinitely — if the DB is also down we
    // still want to return a response.
    MediaJob.findByIdAndUpdate(job._id, {
      status: "failed",
      error: { code: reason, message: err?.message || String(err) },
      finishedAt: new Date(),
    })
      .then(() => {})
      .catch(() => {});

    const userMessage =
      reason === "queue_unreachable"
        ? "Image generation is offline right now (the worker queue is unreachable). Try again in a minute, or ping the team if it persists."
        : "I couldn't start the image job — something went wrong on our side. Please try again.";

    return {
      messages: [new AIMessage(userMessage)],
      finalResponse: true,
    };
  }
}
