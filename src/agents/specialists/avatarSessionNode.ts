import { State } from "../state";
import { AvatarSession } from "@/models/AvatarSession";
import { WebRTCSignalingService } from "@/services/avatar/webrtcService";

/**
 * Avatar Session Node
 * Manages the orchestration of a live avatar session within the graph.
 * This handles the transition from chat to live video/audio transport state.
 */
export async function avatarSessionNode(state: State) {
  // If the user hasn't explicitly requested to "talk live", we pass through.
  // In a real implementation, the intentDetector would have flagged "live_talk".
  
  if (state.intent === "casual_chat" && state.messages[state.messages.length - 1].content.toString().toLowerCase().includes("talk live")) {
     console.log("[AvatarSessionNode] Initiating WebRTC signaling...");
     
     // Note: In a production graph, we would perform side-effects like 
     // creating a session token here and updating the graph state.
     
     return {
       next: "FINISH",
       messages: [{ role: "assistant", content: "I'm setting up our live connection now. One moment..." }]
     };
  }

  return { next: "supervisor" };
}
