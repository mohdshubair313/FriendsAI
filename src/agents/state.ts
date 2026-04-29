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
  mood: Annotation<string>({
    reducer: (curr, update) => update,
    default: () => "friendly",
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
