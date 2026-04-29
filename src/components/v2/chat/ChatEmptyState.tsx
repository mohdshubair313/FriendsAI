"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import * as React from "react";
import type { ChatSuggestion } from "./types";

interface ChatEmptyStateProps {
  userName?: string;
  suggestions?: ChatSuggestion[];
  onPickSuggestion?: (s: ChatSuggestion) => void;
  className?: string;
}

const DEFAULT_SUGGESTIONS: ChatSuggestion[] = [
  {
    id: "vent",
    category: "Talk it out",
    label: "I had a rough day at work",
    prompt: "I had a rough day at work and I just need to vent. Can you listen?",
  },
  {
    id: "plan",
    category: "Brainstorm",
    label: "Plan a weekend in Tokyo",
    prompt:
      "Help me plan a calm three-day weekend in Tokyo. I like quiet bookshops, slow walks, and good ramen.",
  },
  {
    id: "code",
    category: "Code",
    label: "Explain LangGraph supervisors",
    prompt:
      "Explain LangGraph supervisor agents — when to use them vs ReAct, with a small TypeScript example.",
  },
  {
    id: "image",
    category: "Generate",
    label: "Render a moody product shot",
    prompt:
      "Generate a cinematic, moody product photograph of a black ceramic kettle on a marble counter, soft window light from the left.",
  },
];

export function ChatEmptyState({
  userName,
  suggestions = DEFAULT_SUGGESTIONS,
  onPickSuggestion,
  className,
}: ChatEmptyStateProps) {
  const greeting = greet();
  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center px-4 py-16 text-center",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative grid h-14 w-14 place-items-center"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#6366f1,#22d3ee,#a855f7,#6366f1)] opacity-90 blur-[3px]"
        />
        <span className="absolute inset-[3px] rounded-full bg-[#070709]" />
        <span
          aria-hidden
          className="relative h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_18px_4px_rgba(255,255,255,0.7)]"
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="v2-font-display mt-7 max-w-[16ch] text-balance text-[42px] leading-[1] tracking-[-0.02em] text-white md:text-[58px]"
      >
        {greeting}
        {userName ? (
          <>
            ,{" "}
            <em className="not-italic v2-text-iridescent">{userName}</em>.
          </>
        ) : (
          "."
        )}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
        className="v2-font-sans mt-4 max-w-[44ch] text-[15.5px] leading-relaxed text-white/55"
      >
        What&rsquo;s on your mind today? Talk it out, build something, or pick a starter below.
      </motion.p>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
        }}
        className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2"
        aria-label="Conversation starters"
      >
        {suggestions.map((s) => (
          <motion.li
            key={s.id}
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={() => onPickSuggestion?.(s)}
              className={cn(
                "group/sug relative w-full overflow-hidden rounded-2xl px-4 py-3.5 text-left",
                "v2-glass border-white/[0.07]",
                "transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "hover:-translate-y-0.5 hover:border-white/15",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover/sug:opacity-100"
                style={{
                  background:
                    "radial-gradient(60% 80% at 50% 0%, rgba(99,102,241,0.18), transparent 60%)",
                }}
              />
              {s.category && (
                <span className="v2-text-eyebrow text-white/45">
                  {s.category}
                </span>
              )}
              <div className="mt-1 v2-font-sans text-[14.5px] font-medium text-white/85 group-hover/sug:text-white">
                {s.label}
              </div>
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

function greet() {
  const h = new Date().getHours();
  if (h < 5) return "Late hours";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Hello, night owl";
}
