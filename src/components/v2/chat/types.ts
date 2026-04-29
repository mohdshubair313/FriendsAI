export type ChatRole = "user" | "assistant" | "system";

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  /** ObjectURL for client-side preview, or remote URL after upload. */
  url?: string;
}

/**
 * A single trace step from the agent graph (LangGraph supervisor, tool calls, RAG, etc.)
 * Render in AgentStatus pill while the assistant is thinking, and optionally
 * collapse them under the final assistant message as a faint trace.
 */
export interface AgentStep {
  id: string;
  kind:
    | "thinking"
    | "tool"
    | "search"
    | "fetch"
    | "memory"
    | "image"
    | "voice"
    | "route";
  label: string;
  /** Active = currently running, done = finished. */
  status: "active" | "done" | "error";
  /** Optional secondary detail (e.g. "Searching site:nytimes.com"). */
  detail?: string;
  /** Wall-clock ms duration once complete. */
  durationMs?: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Markdown body. */
  content: string;
  createdAt: number;
  attachments?: ChatAttachment[];
  /** Trace steps recorded for this assistant turn. */
  agentSteps?: AgentStep[];
  /** True while the assistant is still streaming this message. */
  isStreaming?: boolean;
  /** True if the turn errored after partial content. */
  hasError?: boolean;
}

export interface ChatSuggestion {
  id: string;
  label: string;
  /** Body filled into the input on click. */
  prompt: string;
  /** Optional eyebrow category, e.g. "Brainstorm". */
  category?: string;
}

/**
 * Top-level prop contract for the chat surface.
 * Designed to be wire-compatible with the Vercel AI SDK's `useChat` hook
 * and any LangGraph-streaming custom hook — onSubmit takes the raw text
 * + attachments and the parent owns the message state.
 */
export interface ChatInterfaceProps {
  messages: ChatMessage[];
  /**
   * Trace for the *currently-streaming* assistant turn.
   * When the turn finishes, parent should attach this to the final message.
   */
  liveAgentSteps?: AgentStep[];
  /** True while waiting on the model (covers thinking + streaming). */
  isStreaming?: boolean;
  /** Submitted message body + optional file uploads. */
  onSubmit: (input: string, attachments?: File[]) => void;
  /** Cancel the in-flight stream. */
  onStop?: () => void;
  /** Open the live voice / avatar overlay. */
  onVoice?: () => void;
  /** Trigger a regenerate-last-response action. */
  onRegenerate?: () => void;
  /** Surface error from the parent. */
  error?: Error | null;
  /** Empty-state suggestions. */
  suggestions?: ChatSuggestion[];
  /** User display name shown above their messages. */
  userName?: string;
  /** Premium gates voice + image. */
  isPremium?: boolean;
  className?: string;
}
