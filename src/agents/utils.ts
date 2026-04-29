import { BaseMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Reorders and merges messages for Google Gemini compatibility.
 * 1. Collects all SystemMessages.
 * 2. Merges their content into one single SystemMessage.
 * 3. Prepends any provided 'instruction' to that SystemMessage.
 * 4. Ensures the SystemMessage is the VERY FIRST message in the array.
 */
export function getGeminiSafeMessages(messages: BaseMessage[], instruction?: string): BaseMessage[] {
  const systemMessages = messages.filter(m => m._getType() === "system");
  const otherMessages = messages.filter(m => m._getType() !== "system");

  const systemContents = systemMessages.map(m => m.content.toString());
  if (instruction) {
    systemContents.unshift(instruction);
  }

  // If we have no system content at all, just return others. 
  // But usually we want at least one if instruction is provided.
  if (systemContents.length === 0) {
    return otherMessages;
  }

  const mergedSystemMessage = new SystemMessage({
    content: systemContents.join("\n\n"),
    additional_kwargs: {}
  });

  return [mergedSystemMessage, ...otherMessages];
}
