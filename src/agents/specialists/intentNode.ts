import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { State } from "../state";
import { routeModel, getProviderApiKey } from "@/services/providers/registry";

const IntentSchema = z.object({
  primaryIntent: z.enum([
    "casual_chat",
    "generate_image",
    "seek_advice",
    "technical_support",
    "recommendation_request"
  ]).describe("The primary intent of the user's latest message"),
});

export async function intentNode(state: State, config?: any) {
  const latestMessage = state.messages[state.messages.length - 1]?.content?.toString() || "";
  console.log("[IntentNode] Analyzing:", latestMessage.slice(0, 30));
  
  const apiKey = getProviderApiKey("openrouter");
  if (!apiKey) {
    const message = latestMessage.toLowerCase();
    if (message.includes("generate") || message.includes("create") || message.includes("draw") || message.includes("image")) {
      console.log("[IntentNode] Fallback: generate_image");
      return { intent: "generate_image" };
    }
    if (message.includes("recommend") || message.includes("suggest")) {
      console.log("[IntentNode] Fallback: recommendation_request");
      return { intent: "recommendation_request" };
    }
    console.log("[IntentNode] Fallback: casual_chat");
    return { intent: "casual_chat" };
  }

  const configModel = routeModel("intent", { maxLatencyMs: 300 });
  const llm = new ChatOpenAI({
    model: configModel.modelId,
    apiKey: apiKey,
    temperature: configModel.temperature,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    }
  });

  const structuredLlm = llm.withStructuredOutput(IntentSchema, { name: "intent" });

  try {
    const { getGeminiSafeMessages } = await import("../utils");
    const analysis = await structuredLlm.invoke(
      getGeminiSafeMessages(state.messages, "Classify the user's intent.")
    );

    console.log("[IntentNode] Detected:", analysis.primaryIntent);
    
    return { intent: analysis.primaryIntent };
  } catch (err) {
    console.error("[IntentNode] Error:", err);
    return { intent: "casual_chat" };
  }
}
