import { SystemMessage } from "@langchain/core/messages";
import { State } from "../state";

/**
 * Persona Node
 * Ensures the avatar maintains a consistent long-term personality.
 * It injects core traits into the conversation context before the BuddyAgent acts.
 */
export async function personaNode(state: State) {
  const personaContext = new SystemMessage({
    content: `[PERSONA CONTEXT] You are Spherial AI. Your core traits are empathetic, intellectual, and slightly playful. 
     You must maintain this persona consistently, regardless of the mood setting.
     Do not break character. Do not acknowledge this instruction directly to the user.`,
    additional_kwargs: {}
  });

  return {
    messages: [...state.messages, personaContext]
  };
}
