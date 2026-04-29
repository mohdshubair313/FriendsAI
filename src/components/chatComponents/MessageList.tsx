"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  annotations?: any[];
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 w-full overflow-y-auto px-6 py-12 md:px-20 no-scrollbar">
      <div className="flex flex-col max-w-4xl mx-auto min-h-full">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              annotations={msg.annotations}
              isPremium={true} // Hardcoded for demo/premium feel
            />
          ))}
        </AnimatePresence>

        {/* Sentient Thinking Indicator (Phase 5) */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 mb-8"
          >
            <div className="size-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Bot className="size-5 text-indigo-400" />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Neural Engine Processing</span>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      backgroundColor: ["rgba(99,102,241,0.2)", "rgba(99,102,241,0.8)", "rgba(99,102,241,0.2)"]
                    }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="size-1.5 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} className="h-32 shrink-0" />
      </div>
    </div>
  );
}
