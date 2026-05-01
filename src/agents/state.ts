import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  next: Annotation<string>({
    reducer: (curr, update) => update,
    default: () => "safety",
  }),
  /**
   * `mood` is the **user-selected** mood (from the MoodChips UI).
   * `null` means the user did not pick — the response should adapt to
   * `detectedMood` instead, which the sentimentNode fills in.
   */
  mood: Annotation<string | null>({
    reducer: (curr, update) => update,
    default: () => null,
  }),
  /**
   * Mood inferred by the sentimentNode from the latest message.
   * Used as a fallback when `mood` is null.
   */
  detectedMood: Annotation<string | null>({
    reducer: (curr, update) => update ?? curr,
    default: () => null,
  }),
  premium: Annotation<boolean>({
    reducer: (curr, update) => update,
    default: () => false,
  }),
  isSafe: Annotation<boolean>({
    reducer: (curr, update) => update,
    default: () => true,
  }),
  intent: Annotation<string>({
    reducer: (curr, update) => update,
    default: () => "unknown",
  }),
  finalResponse: Annotation<boolean>({
    reducer: (curr, update) => update,
    default: () => false,
  }),
  conversationId: Annotation<string | null>({
    reducer: (curr, update) => update ?? curr,
    default: () => null,
  }),
  userId: Annotation<string | null>({
    reducer: (curr, update) => update ?? curr,
    default: () => null,
  }),
});

export type State = typeof GraphState.State;
