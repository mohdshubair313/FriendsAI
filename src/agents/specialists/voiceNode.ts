import { State } from "../state";
import { AIMessage } from "@langchain/core/messages";
import { routeModel, getProviderApiKey, hasProviderKey } from "@/services/providers/registry";

/**
 * Voice Node
 * Manages the transition to voice-only mode (VoiceSession).
 */
export async function voiceNode(state: State) {
  if (!hasProviderKey("google") && !state.premium) {
    return {
      messages: [new AIMessage({
        content: "Voice mode is not available at the moment. Please try again later.",
        additional_kwargs: {}
      })],
      finalResponse: true
    };
  }

  const config = routeModel("voice_tts", { requiresPremium: state.premium });
  
  console.log(`[VoiceNode] Preparing voice output using ${config.modelId}`);

  return {
    messages: [new AIMessage({
      content: "Entering voice mode. You can speak to me now.",
      additional_kwargs: {}
    })],
    finalResponse: true
  };
}
