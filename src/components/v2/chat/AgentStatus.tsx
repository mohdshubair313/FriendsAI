"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import type { AgentStep } from "./types";

interface AgentStatusProps {
  /**
   * Live agent steps for the in-flight assistant turn.
   * The most recent active step is rendered prominently;
   * completed steps surface a thin "trail" you can hover.
   */
  steps?: AgentStep[];
  /** True if we're waiting on the model but no steps have arrived yet. */
  isThinking?: boolean;
  className?: string;
}

/**
 * The "live" agent indicator that appears in the message stream
 * while the assistant is working. Self-contained — call sites just
 * pass the live step list and we crossfade between states.
 */
export function AgentStatus({
  steps = [],
  isThinking = false,
  className,
}: AgentStatusProps) {
  const active = steps.find((s) => s.status === "active") ?? steps[steps.length - 1];
  const visible = isThinking || steps.length > 0;
  if (!visible) return null;

  const label = active?.label ?? "Thinking";
  const detail = active?.detail;
  const kind = active?.kind ?? "thinking";

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex w-full max-w-[820px] gap-4",
        className
      )}
    >
      {/* Match avatar slot from ChatMessage so spacing aligns */}
      <div aria-hidden className="relative mt-0.5 grid h-7 w-7 shrink-0 place-items-center">
        <PulseHalo />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div
          className={cn(
            "inline-flex w-fit items-center gap-2.5 rounded-full px-3 py-1.5",
            "v2-glass border border-white/10",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
          )}
        >
          <KindBadge kind={kind} />
          <AnimatePresence mode="wait">
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="flex min-w-0 items-center gap-2"
            >
              <span className="v2-font-sans text-[13px] font-medium text-white/85">
                {label}
              </span>
              <Dots />
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {detail && (
            <motion.p
              key={detail}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.2 }}
              className="v2-font-sans pl-1 text-[12.5px] text-white/45"
            >
              {detail}
            </motion.p>
          )}
        </AnimatePresence>

        {steps.length > 1 && <StepTrail steps={steps} />}
      </div>
    </motion.div>
  );
}

/* ---------------------------- subviews ---------------------------- */

function StepTrail({ steps }: { steps: AgentStep[] }) {
  // Show prior completed steps as a faint inline chip row.
  const done = steps.filter((s) => s.status === "done");
  if (done.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 pl-1">
      {done.map((s) => (
        <span
          key={s.id}
          className="inline-flex items-center gap-1 rounded-md bg-white/[0.025] px-1.5 py-0.5 text-[11px] text-white/45 ring-1 ring-white/[0.05]"
        >
          <DotCheck />
          <span className="max-w-[180px] truncate">{s.label}</span>
        </span>
      ))}
    </div>
  );
}

function KindBadge({ kind }: { kind: AgentStep["kind"] }) {
  return (
    <span
      aria-hidden
      className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-violet-400/25 to-cyan-300/20 text-cyan-100 ring-1 ring-white/15"
    >
      {iconForKind(kind)}
    </span>
  );
}

function iconForKind(kind: AgentStep["kind"]) {
  switch (kind) {
    case "search":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="4.3" cy="4.3" r="2.8" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6.3 6.3L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "fetch":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.1" />
          <path d="M1.5 5h7" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case "memory":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="2" y="1.5" width="6" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.1" />
          <path d="M3.5 4h3M3.5 6h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
    case "image":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="1.2" y="1.5" width="7.6" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="3.5" cy="4" r="0.8" fill="currentColor" />
        </svg>
      );
    case "voice":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="3.8" y="1.2" width="2.4" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
          <path d="M2 5a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
    case "route":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="2" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="8" cy="2.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="8" cy="7.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <path d="M3.2 5L7 2.5M3.2 5L7 7.5" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case "tool":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 8l3-3M5 5a2 2 0 1 1 3-3 2 2 0 0 1-3 3z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.1" />
          <path d="M5 3v2.2L6.4 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
  }
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-[3px] w-[3px] rounded-full bg-white/70"
          initial={{ opacity: 0.25, scale: 0.85 }}
          animate={{
            opacity: [0.25, 1, 0.25],
            scale: [0.85, 1.05, 0.85],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.18,
          }}
        />
      ))}
    </span>
  );
}

function DotCheck() {
  return (
    <span className="grid h-2.5 w-2.5 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
      <svg width="6" height="6" viewBox="0 0 6 6" fill="none" aria-hidden>
        <path d="M1.2 3.1L2.5 4.4 4.8 1.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300" />
      </svg>
    </span>
  );
}

function PulseHalo() {
  return (
    <>
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#6366f1,#22d3ee,#a855f7,#6366f1)] opacity-90 blur-[2px]" />
      <span className="absolute inset-[2px] rounded-full bg-[#070709]" />
      <motion.span
        className="relative h-1.5 w-1.5 rounded-full bg-white"
        animate={{ opacity: [0.45, 1, 0.45], scale: [0.85, 1.15, 0.85] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ boxShadow: "0 0 12px 2px rgba(255,255,255,0.65)" }}
      />
    </>
  );
}
