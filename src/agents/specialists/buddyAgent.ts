import { ChatOpenAI } from "@langchain/openai";
import { AIMessage } from "@langchain/core/messages";
import { State } from "../state";
import { routeModel, getProviderApiKey } from "@/services/providers/registry";

const MOOD_INSTRUCTIONS: Record<string, string> = {
  friendly: "Respond in a warm, friendly, and approachable tone. Be helpful and conversational.",
  happy: "Respond in a cheerful and uplifting tone. Be enthusiastic and positive.",
  sad: "Respond in an empathetic and comforting tone. Be gentle, understanding, and supportive.",
  funny: "Respond with humor and light wit. Be playful but not sarcastic.",
  romantic: "Respond in a poetic and dreamy tone. Use thoughtful and expressive language.",
  angry: "Respond in a calm, patient and understanding tone. Help defuse tension.",
  motivational: "Respond with strong encouragement and positive energy. Inspire action.",
  philosophical: "Respond with deep and thoughtful insight. Explore ideas with curiosity.",
};

/**
 * Streaming token writer passed via `config.configurable.streamWriter`.
 * The orchestrate route supplies one — when present, the buddy agent
 * uses `llm.stream()` and emits `{ type: "token", content }` events as
 * tokens arrive. When absent (e.g. tests / future non-HTTP callers), it
 * falls back to a single `llm.invoke()`.
 */
export type BuddyStreamWriter = (chunk: { type: string; content?: string }) => void;

/**
 * Hybrid mood resolution:
 *   1. User explicitly picked via MoodChips  → use that
 *   2. Sentiment node detected something      → use that
 *   3. Otherwise                              → "friendly"
 *
 * This means a user who never touches MoodChips still gets adaptive
 * tone, while a user who picks "Funny" never has the AI silently
 * override them based on what it thinks they're feeling.
 */
function resolveMood(state: State): { mood: string; source: "user" | "detected" | "default" } {
  if (state.mood) return { mood: state.mood, source: "user" };
  if (state.detectedMood) return { mood: state.detectedMood, source: "detected" };
  return { mood: "friendly", source: "default" };
}

export async function buddyAgent(state: State, config?: any) {
  const { mood: effectiveMood, source: moodSource } = resolveMood(state);
  console.log("[BuddyAgent] Mood:", effectiveMood, `(${moodSource})`);

  const writer: BuddyStreamWriter | undefined = config?.configurable?.streamWriter;
  const signal: AbortSignal | undefined = config?.configurable?.abortSignal;

  const apiKey = getProviderApiKey("openrouter");
  if (!apiKey) {
    console.log("[BuddyAgent] No OpenRouter API key - fallback response");
    const fallback = "Hi there! I'm here and ready to chat. What's on your mind?";
    if (writer) writer({ type: "token", content: fallback });
    return {
      messages: [new AIMessage({ content: fallback, additional_kwargs: {} })],
      finalResponse: true,
    };
  }

  const configModel = routeModel("chat_standard");
  console.log("[BuddyAgent] Using model:", configModel.modelId, writer ? "(streaming)" : "(invoke)");

  const llm = new ChatOpenAI({
    model: configModel.modelId,
    apiKey: apiKey,
    temperature: configModel.temperature ?? 0.7,
    streaming: !!writer,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });

  const moodInstruction = MOOD_INSTRUCTIONS[effectiveMood] ?? MOOD_INSTRUCTIONS.friendly;

  const { getGeminiSafeMessages } = await import("../utils");

  // Persona traits inlined here so we can drop the separate personaNode
  // (it was duplicating identity instructions and inflating token count).
  const systemPrompt = `You are Friends AI — an emotionally intelligent companion. Empathetic, intellectual, and slightly playful by default.
${moodInstruction}
Keep responses concise, natural, and genuine. Never break character.`;

  const messages = getGeminiSafeMessages(state.messages, systemPrompt);

  // ─── Streaming path ────────────────────────────────────────────────
  if (writer) {
    let acc = "";
    try {
      const stream = await llm.stream(messages, { signal });
      for await (const chunk of stream) {
        if (signal?.aborted) break;
        const token = chunk.content?.toString() ?? "";
        if (!token) continue;
        acc += token;
        writer({ type: "token", content: token });
      }
      console.log("[BuddyAgent] Streamed response:", acc.slice(0, 50), "·", acc.length, "chars");
      return {
        messages: [new AIMessage({ content: acc, additional_kwargs: {} })],
        finalResponse: true,
      };
    } catch (err: any) {
      const aborted = err?.name === "AbortError" || signal?.aborted;
      console.error("[BuddyAgent] Stream error:", aborted ? "(aborted)" : err?.message || err);
      // Re-raise abort so the route can clean up cleanly.
      if (aborted) throw err;
      const fallback = "I'm having trouble responding right now. Please try again.";
      writer({ type: "token", content: fallback });
      return {
        messages: [new AIMessage({ content: fallback, additional_kwargs: {} })],
        finalResponse: true,
      };
    }
  }

  // ─── Non-streaming fallback (preserves existing callers) ───────────
  try {
    const response = await llm.invoke(messages, { signal });
    const reply = response.content?.toString();
    console.log("[BuddyAgent] Response:", reply?.slice(0, 50));
    return {
      messages: [response],
      finalResponse: true,
    };
  } catch (err) {
    console.error("[BuddyAgent] Error:", err);
    return {
      messages: [
        new AIMessage({
          content: "I'm having trouble responding right now. Please try again.",
          additional_kwargs: {},
        }),
      ],
      finalResponse: true,
    };
  }
}
