import { ChatOpenAI } from "@langchain/openai";
import { AIMessage } from "@langchain/core/messages";
import { State } from "../state";
import { routeModel, getProviderApiKey, hasProviderKey } from "@/services/providers/registry";

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

export async function buddyAgent(state: State, config?: any) {
  console.log("[BuddyAgent] Processing chat, mood:", state.mood);
  
  const apiKey = getProviderApiKey("openrouter");
  if (!apiKey) {
    console.log("[BuddyAgent] No OpenRouter API key - fallback response");
    return {
      messages: [new AIMessage({ 
        content: "Hi there! I'm here and ready to chat. What's on your mind?", 
        additional_kwargs: {} 
      })],
      finalResponse: true,
    };
  }

  const configModel = routeModel("chat_standard");
  console.log("[BuddyAgent] Using model:", configModel.modelId);
  
  const llm = new ChatOpenAI({
    model: configModel.modelId,
    apiKey: apiKey,
    temperature: configModel.temperature ?? 0.7,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    }
  });

  const moodInstruction = MOOD_INSTRUCTIONS[state.mood] ?? MOOD_INSTRUCTIONS.friendly;

  const { getGeminiSafeMessages } = await import("../utils");
  
  try {
    const response = await llm.invoke(
      getGeminiSafeMessages(state.messages, `
        You are Spherial AI — an emotionally intelligent companion.
        ${moodInstruction}
        Keep responses concise, natural, and genuine.
        Never break character.
      `)
    );

    const reply = response.content?.toString();
    console.log("[BuddyAgent] Response:", reply?.slice(0, 50));

    return {
      messages: [response],
      finalResponse: true,
    };
  } catch (err) {
    console.error("[BuddyAgent] Error:", err);
    return {
      messages: [new AIMessage({ 
        content: "I'm having trouble responding right now. Please try again.", 
        additional_kwargs: {} 
      })],
      finalResponse: true,
    };
  }
}
