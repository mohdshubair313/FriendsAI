"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  annotations?: any[];
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  /**
   * Pipeline mode reported by the orchestrate route via the `start` SSE
   * event. `"fast"` (greetings/small talk) returns the first token in
   * ~1 s, so a typing pulse adds no value. `"graph"` runs the full
   * pre-processing chain — show the pulse until the first token lands.
   */
  mode?: "fast" | "graph" | null;
}

export default function MessageList({ messages, isLoading, mode }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on update.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Show the thinking pulse only while:
  //   - we're in the slow (graph) path,
  //   - and the assistant placeholder is empty (no tokens yet).
  const lastMsg = messages[messages.length - 1];
  const showThinking =
    !!isLoading &&
    mode === "graph" &&
    lastMsg?.role === "assistant" &&
    !lastMsg.content;

  return (
    <div className="flex-1 w-full overflow-y-auto px-6 pt-4 pb-2 md:px-12 no-scrollbar">
      <div className="flex flex-col max-w-3xl mx-auto min-h-full">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              annotations={msg.annotations}
            />
          ))}
        </AnimatePresence>

        {/* Thinking pulse — only on slow path, only before first token */}
        <AnimatePresence>
          {showThinking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-3 mb-8 -mt-4"
            >
              <div className="shrink-0 size-9 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-600/40 ring-1 ring-indigo-400/30 flex items-center justify-center animate-pulse">
                <Bot className="size-4 text-indigo-200" />
              </div>
              <div className="flex flex-col gap-2 pt-1.5">
                <span className="text-[11px] font-medium text-zinc-500">Friends AI</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-zinc-400">Thinking</span>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.18 }}
                      className="size-1 rounded-full bg-indigo-400"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-24 shrink-0" />
      </div>
    </div>
  );
}
