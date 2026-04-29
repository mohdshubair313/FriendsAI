import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { State } from "./state";
import { routeModel, getProviderApiKey, hasProviderKey } from "@/services/providers/registry";

const RouterSchema = z.object({
  next: z.enum(["buddy", "visual", "recommendation", "FINISH"]),
});

export async function supervisorNode(state: State, config?: any) {
  console.log("[Supervisor] Routing, intent:", state.intent);
  
  const apiKey = getProviderApiKey("openrouter");
  if (!apiKey) {
    console.log("[Supervisor] No OpenRouter key - default to buddy");
    return { next: "buddy" };
  }

  const configModel = routeModel("supervisor");
  const llm = new ChatOpenAI({
    model: configModel.modelId,
    apiKey: apiKey,
    temperature: configModel.temperature ?? 0,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    }
  });

  const systemPrompt = `
You are the Supervisor Router for Friends AI.
Your job is to look at the conversation, along with the pre-computed intent, and decide which specialized agent should handle the user's latest request.

Pre-computed Intent: ${state.intent}

Available Agents:
- "buddy": The core conversationalist. Use this for almost everything (chatting, advice, roleplay, jokes, deep talks).
- "visual": The image generation agent. Use this ONLY if the user explicitly asks to generate, create, draw, or paint an image.
- "recommendation": Use this if the user is explicitly asking for suggestions or recommendations.
- "FINISH": Use this if the task is already complete.

Respond ONLY with the name of the agent to route to next.
  `;

  const structuredLlm = llm.withStructuredOutput(RouterSchema, { name: "route" });
  
  const { getGeminiSafeMessages } = await import("./utils");
  
  try {
    const response = await structuredLlm.invoke(
      getGeminiSafeMessages(state.messages, systemPrompt)
    );

    console.log("[Supervisor] Routing to:", response.next);
    return {
      next: response.next,
    };
  } catch (err) {
    console.error("[Supervisor] Error:", err);
    return { next: "buddy" };
  }
}
