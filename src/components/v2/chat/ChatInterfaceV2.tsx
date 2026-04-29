"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatInputV2 } from "./ChatInputV2";
import {
  ChatMessageList,
  type ChatMessageListHandle,
} from "./ChatMessageList";
import type { ChatInterfaceProps } from "./types";

/**
 * Top-level V2 chat surface.
 *
 * Stateless w/r/t the message list — the parent owns `messages` and
 * `liveAgentSteps`, and is responsible for streaming token-by-token updates.
 * This makes the surface trivial to plug into:
 *   - the Vercel AI SDK's `useChat`
 *   - a LangGraph custom hook
 *   - a vanilla EventSource handler
 *
 * Visual layout:
 *   - Floating spatial panel: deep void background, hairline border, blur.
 *   - The list flexes to fill, the input docks at the bottom with a soft
 *     gradient mask above it so messages fade out behind the input.
 */
export function ChatInterfaceV2({
  messages,
  liveAgentSteps,
  isStreaming,
  onSubmit,
  onStop,
  onVoice,
  onRegenerate,
  error,
  suggestions,
  userName,
  isPremium,
  className,
}: ChatInterfaceProps) {
  const listRef = React.useRef<ChatMessageListHandle>(null);
  const [injectValue, setInjectValue] = React.useState<string | undefined>();

  const handleSubmit = (text: string, files?: File[]) => {
    onSubmit(text, files);
    // After the parent ingests the message, pin to bottom on next paint.
    requestAnimationFrame(() => listRef.current?.stickToBottom(true));
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      className={cn(
        "relative isolate flex h-full w-full flex-col",
        "v2-font-sans bg-[#050507] text-white",
        className
      )}
    >
      {/* Soft, very-low-intensity aurora behind everything (atmosphere only). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div
          className="absolute -top-40 left-1/2 h-[420px] w-[120%] -translate-x-1/2 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.10), transparent 60%)",
          }}
        />
        <div className="v2-grid-bg absolute inset-0 opacity-30" />
      </div>

      {/* Body */}
      {isEmpty ? (
        <div className="flex flex-1 items-center justify-center">
          <ChatEmptyState
            userName={userName}
            suggestions={suggestions}
            onPickSuggestion={(s) => setInjectValue(s.prompt)}
          />
        </div>
      ) : (
        <div className="relative min-h-0 flex-1">
          <ChatMessageList
            ref={listRef}
            messages={messages}
            liveAgentSteps={liveAgentSteps}
            isStreaming={isStreaming}
            onRegenerate={onRegenerate}
            userName={userName}
          />
        </div>
      )}

      {/* Input dock */}
      <div className="relative px-4 pb-5 pt-2 md:px-6">
        {/* Mask so the message list fades into the input dock instead of clipping hard */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-b from-transparent to-[#050507]"
        />

        {error && (
          <div
            role="alert"
            className="mx-auto mb-3 flex w-full max-w-3xl items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200"
          >
            <ErrorIcon />
            <span className="truncate">{error.message}</span>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl">
          <ChatInputV2
            onSubmit={handleSubmit}
            onStop={onStop}
            onVoice={onVoice}
            isStreaming={isStreaming}
            isPremium={isPremium}
            injectValue={injectValue}
          />
          <p className="mt-3 text-center text-[11px] text-white/30">
            Friends can make mistakes — verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 4v3M6.5 9v.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
