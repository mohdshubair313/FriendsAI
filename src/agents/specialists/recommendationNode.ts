import { ChatOpenAI } from "@langchain/openai";
import { AIMessage } from "@langchain/core/messages";
import { State } from "../state";
import { routeModel, getProviderApiKey } from "@/services/providers/registry";

/**
 * Recommendation Agent
 * Handles suggestions for music, shows, books, or activities based on user mood/preferences.
 */
export async function recommendationNode(state: State) {
  const apiKey = getProviderApiKey("openrouter");
  if (!apiKey) {
    return {
      messages: [new AIMessage({
        content: "Here are some general recommendations based on your mood (" + state.mood + "):\n\n1. Try exploring new activities that match your energy.\n2. Consider listening to music that matches how you feel.\n3. Take a moment to reflect on what brings you joy.",
        additional_kwargs: {}
      })],
      finalResponse: true,
    };
  }

  const config = routeModel("recommendation");
  const llm = new ChatOpenAI({
    model: config.modelId,
    apiKey: apiKey,
    temperature: config.temperature,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    }
  });

  const { getGeminiSafeMessages } = await import("../utils");
  try {
    const response = await llm.invoke(
      getGeminiSafeMessages(state.messages, `
        You are an expert recommender AI.
        The user is asking for recommendations (music, movies, books, games, or activities).
        Keep in mind their current mood context: ${state.mood}.
        Provide 3 highly curated, specific recommendations with a short explanation of why they fit.
      `)
    );

    return {
      messages: [response],
      finalResponse: true,
    };
  } catch (err) {
    console.error("[RecommendationNode] Error:", err);
    return {
      messages: [new AIMessage({
        content: "I'd recommend some activities to lift your mood! Try going for a walk, listening to your favorite music, or calling a friend.",
        additional_kwargs: {}
      })],
      finalResponse: true,
    };
  }
}
