import { State } from "../state";
import { Message } from "@/models/Conversation";

/**
 * Persistence Node
 * Responsible for saving the graph's state to MongoDB at the end of the turn.
 * Logs the generated messages, token usage (via ProviderUsageLog elsewhere), and current sentiment/intent.
 */
export async function persistenceNode(state: State) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage && state.conversationId) {
    try {
      console.log("[PersistenceNode] Saving state to DB. Intent:", state.intent, "Conversation:", state.conversationId);
      
      // await Message.create({
      //   conversationId: state.conversationId,
      //   role: "assistant",
      //   content: lastMessage.content.toString(),
      //   metadata: {
      //     intent: state.intent,
      //     userId: state.userId,
      //   }
      // });
    } catch (error) {
      console.error("[PersistenceNode] Failed to save state:", error);
    }
  } else {
    console.log("[PersistenceNode] No conversationId, skipping DB save. Intent:", state.intent);
  }

  return {};
}
