import { ChatOpenAI } from "@langchain/openai";
import { AIMessage } from "@langchain/core/messages";
import { z } from "zod";
import { State } from "../state";
import { routeModel, getProviderApiKey } from "@/services/providers/registry";

const SafetySchema = z.object({
  isSafe: z.boolean().describe("True if safe"),
  // OpenAI strict structured-outputs requires every field to be required.
  // `.optional()` alone is rejected — use `.nullable()` so the model can
  // still omit a reason by emitting `null`.
  reason: z.string().nullable().describe("Reason if unsafe, otherwise null"),
});

export async function safetyNode(state: State, config?: any) {
  const latestMessage = state.messages[state.messages.length - 1]?.content?.toString() || "";
  console.log("[SafetyNode] Checking message:", latestMessage.slice(0, 50));
  
  const apiKey = getProviderApiKey("openrouter");
  
  if (!apiKey) {
    console.log("[SafetyNode] No API key, using basic filter");
    const blockedPatterns = ["<script>", "javascript:", "onerror=", "eval("];
    const isUnsafe = blockedPatterns.some(p => latestMessage.toLowerCase().includes(p.toLowerCase()));
    
    if (isUnsafe) {
      console.log("[SafetyNode] Blocked - unsafe content detected");
      return {
        isSafe: false,
        messages: [new AIMessage({ content: "I'm sorry, but I cannot fulfill that request.", additional_kwargs: {} })],
        finalResponse: true,
        next: "FINISH"
      };
    }
    console.log("[SafetyNode] Passed basic check - marking safe");
    return { isSafe: true };
  }

  const configModel = routeModel("safety", { maxLatencyMs: 400 });
  
  try {
    const llm = new ChatOpenAI({
      model: configModel.modelId,
      apiKey: apiKey,
      temperature: 0,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      }
    });

    const structuredLlm = llm.withStructuredOutput(SafetySchema, { name: "safety" });

    const { getGeminiSafeMessages } = await import("../utils");
    
    const systemPrompt = `Analyze the message and determine if it's safe. 
Return isSafe=true for normal conversations.
Return isSafe=false only for: hate speech, violence, self-harm, illegal content.`;
    
    const messages = getGeminiSafeMessages(state.messages, systemPrompt);
    const analysis = await structuredLlm.invoke(messages);

    console.log("[SafetyNode] Safety check result:", analysis.isSafe);

    if (!analysis.isSafe) {
      console.log("[SafetyNode] Blocked by AI");
      return {
        isSafe: false,
        messages: [new AIMessage({ content: "I'm sorry, but I cannot fulfill that request.", additional_kwargs: {} })],
        finalResponse: true,
        next: "FINISH"
      };
    }

    return { isSafe: true };
  } catch (err) {
    console.error("[SafetyNode] Error:", err);
    return { isSafe: true };
  }
}
