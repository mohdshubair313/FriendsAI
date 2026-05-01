import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { State } from "../state";
import { routeModel, getProviderApiKey } from "@/services/providers/registry";

const SentimentSchema = z.object({
  score: z.number().min(-1).max(1).describe("Sentiment score from -1 to 1"),
  arousal: z.number().min(0).max(1).describe("Emotional intensity"),
  detectedMood: z.string().describe("Primary emotion in 1-2 words"),
});

/**
 * Map an arbitrary LLM-emitted emotion label onto one of our 8 known
 * mood IDs. Returns `null` if no confident mapping exists, in which
 * case buddyAgent will fall back to "friendly".
 */
function normalizeMood(detected: string): string | null {
  const lower = detected.toLowerCase().trim();
  if (/(sad|down|depress|grief|melancholy|hurt|cry|lonely|tear)/.test(lower)) return "sad";
  if (/(angry|frustrat|upset|mad|annoy|rage|furious|irritat)/.test(lower)) return "angry";
  if (/(happy|joy|excit|cheer|elated|glad|thrill)/.test(lower)) return "happy";
  if (/(funny|humor|laugh|playful|silly|joke)/.test(lower)) return "funny";
  if (/(romantic|love|affection|crush|tender)/.test(lower)) return "romantic";
  if (/(philosoph|deep|reflect|introspect|thoughtful|curious|contempl)/.test(lower)) return "philosophical";
  if (/(motivat|encourag|determin|inspir|pump|driven)/.test(lower)) return "motivational";
  if (/(neutral|friendly|calm|chill|content|fine|okay)/.test(lower)) return "friendly";
  return null;
}

export async function sentimentNode(state: State, config?: any) {
  // ─── Skip if user has already explicitly picked a mood ────────────
  // No point spending an LLM call to detect mood if the result will
  // be ignored anyway. This is the main mood-hybrid optimization.
  if (state.mood) {
    console.log("[SentimentNode] Skipping (user picked:", state.mood, ")");
    return {};
  }

  const apiKey = getProviderApiKey("openrouter");
  if (!apiKey) return {};

  const configModel = routeModel("sentiment", { maxLatencyMs: 300 });
  const llm = new ChatOpenAI({
    model: configModel.modelId,
    apiKey: apiKey,
    temperature: configModel.temperature,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });

  const structuredLlm = llm.withStructuredOutput(SentimentSchema, { name: "sentiment" });

  try {
    const { getGeminiSafeMessages } = await import("../utils");
    const analysis = await structuredLlm.invoke(
      getGeminiSafeMessages(state.messages, "Analyze sentiment.")
    );

    const normalized = normalizeMood(analysis.detectedMood);
    console.log(
      "[SentimentNode]",
      analysis,
      "→ normalized:",
      normalized ?? "(no match, falling back to friendly)"
    );

    return { detectedMood: normalized };
  } catch (err) {
    console.error("[SentimentNode] Failed:", err);
    return {};
  }
}
