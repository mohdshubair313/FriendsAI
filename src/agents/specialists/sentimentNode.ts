import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { State } from "../state";
import { routeModel, getProviderApiKey } from "@/services/providers/registry";

const SentimentSchema = z.object({
  score: z.number().min(-1).max(1).describe("Sentiment score from -1 to 1"),
  arousal: z.number().min(0).max(1).describe("Emotional intensity"),
  detectedMood: z.string().describe("Primary emotion"),
});

export async function sentimentNode(state: State, config?: any) {
  const apiKey = getProviderApiKey("openrouter");
  if (!apiKey) {
    return {};
  }

  const configModel = routeModel("sentiment", { maxLatencyMs: 300 });
  const llm = new ChatOpenAI({
    model: configModel.modelId,
    apiKey: apiKey,
    temperature: configModel.temperature,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    }
  });

  const structuredLlm = llm.withStructuredOutput(SentimentSchema, { name: "sentiment" });

  try {
    const { getGeminiSafeMessages } = await import("../utils");
    const analysis = await structuredLlm.invoke(
      getGeminiSafeMessages(state.messages, "Analyze sentiment.")
    );

    console.log("[Sentiment Node]", analysis);
    
    return {};
  } catch (err) {
    console.error("[SentimentNode] Failed:", err);
    return {};
  }
}