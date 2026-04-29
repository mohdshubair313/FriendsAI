import { State } from "../state";
import { AIMessage } from "@langchain/core/messages";
import { enqueueImageGeneration } from "@/services/queue";
import { MediaJob } from "@/models/MediaJob";

const ALLOWED_MODELS = ["flux-pro", "flux-dev", "sdxl-turbo"] as const;
const MAX_PROMPT_LENGTH = 500;

function sanitizePrompt(prompt: string): string {
  return prompt
    .replace(/<script\b[^<]*(?:(?!<script)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .slice(0, MAX_PROMPT_LENGTH);
}

/**
 * Image Generation Node
 * A formal LangGraph node that manages the asynchronous generation lifecycle.
 * Benefits from graph retry logic and persistent checkpointing.
 */
export async function imageGenerationNode(state: State) {
  const latestMessage = sanitizePrompt(
    state.messages[state.messages.length - 1].content.toString()
  );
  
  const userId = (state as any).userId;
  
  if (!userId) {
    return {
      messages: [new AIMessage("Unable to generate image: user not authenticated.")],
      finalResponse: true
    };
  }

  const validModelId = ALLOWED_MODELS.includes("flux-pro" as any) ? "flux-pro" : "flux-pro";
  
  const job = await MediaJob.create({
    userId,
    conversationId: (state as any).conversationId || null,
    kind: "image",
    prompt: latestMessage,
    modelId: validModelId,
    status: "queued"
  });

  await enqueueImageGeneration(job._id.toString(), latestMessage, validModelId);

  return {
    messages: [new AIMessage(`I've started generating your image. Track progress: /api/media/status/${job._id}`)],
    finalResponse: true
  };
}
