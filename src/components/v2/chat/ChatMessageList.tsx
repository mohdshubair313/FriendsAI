"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { AgentStatus } from "./AgentStatus";
import { ChatMessage } from "./ChatMessage";
import type { AgentStep, ChatMessage as ChatMessageT } from "./types";

interface ChatMessageListProps {
  messages: ChatMessageT[];
  liveAgentSteps?: AgentStep[];
  isStreaming?: boolean;
  onRegenerate?: () => void;
  userName?: string;
  className?: string;
}

/**
 * Scrollable transcript with auto-stick-to-bottom behavior.
 *
 * - We track whether the user has scrolled away from the bottom; if they have,
 *   we don't yank them back when new tokens arrive (a basic "stay where I am" UX).
 * - On submit (new user message), the parent should call requestStickToBottom().
 *   We expose that imperatively via the ref.
 */
export interface ChatMessageListHandle {
  stickToBottom: (smooth?: boolean) => void;
}

export const ChatMessageList = React.forwardRef<
  ChatMessageListHandle,
  ChatMessageListProps
>(function ChatMessageList(
  {
    messages,
    liveAgentSteps,
    isStreaming = false,
    onRegenerate,
    userName,
    className,
  },
  ref
) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [stuckToBottom, setStuckToBottom] = React.useState(true);

  // Imperative pin-to-bottom so the parent can call it on submit.
  React.useImperativeHandle(ref, () => ({
    stickToBottom: (smooth = true) => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setStuckToBottom(true);
    },
  }));

  // Track stick-to-bottom state.
  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStuckToBottom(distance < 80);
  };

  // Auto-scroll on new tokens / message ONLY if we're already at the bottom.
  const lastMsgKey =
    messages.length > 0
      ? messages[messages.length - 1].id +
        ":" +
        messages[messages.length - 1].content.length
      : "";
  React.useEffect(() => {
    if (!stuckToBottom) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight });
  }, [lastMsgKey, isStreaming, stuckToBottom]);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className={cn(
        "relative h-full w-full overflow-y-auto overscroll-contain",
        "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent]",
        className
      )}
    >
      {/* top fade */}
      <div
        aria-hidden
        className="pointer-events-none sticky top-0 z-10 -mb-px h-8 bg-gradient-to-b from-[#050507] via-[#050507]/70 to-transparent"
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-6 md:px-6">
        {messages.map((m, i) => (
          <ChatMessage
            key={m.id}
            message={m}
            isLast={i === messages.length - 1}
            onRegenerate={onRegenerate}
            userName={userName}
          />
        ))}

        <AnimatePresence>
          {(isStreaming || (liveAgentSteps && liveAgentSteps.length > 0)) &&
            !lastMessageIsStreaming(messages) && (
              <AgentStatus
                steps={liveAgentSteps}
                isThinking={isStreaming}
              />
            )}
        </AnimatePresence>
      </div>

      {/* "Jump to latest" pill when scrolled away */}
      <AnimatePresence>
        {!stuckToBottom && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            type="button"
            onClick={() =>
              containerRef.current?.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: "smooth",
              })
            }
            className="sticky bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full v2-glass-strong px-3 py-1.5 text-[12px] text-white/80 shadow-lg hover:text-white"
          >
            ↓ Jump to latest
          </motion.button>
        )}
      </AnimatePresence>

      {/* bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none sticky bottom-0 -mt-px h-10 bg-gradient-to-t from-[#050507] via-[#050507]/70 to-transparent"
      />
    </div>
  );
});

function lastMessageIsStreaming(msgs: ChatMessageT[]): boolean {
  const last = msgs[msgs.length - 1];
  return !!last && last.role === "assistant" && !!last.isStreaming;
}
