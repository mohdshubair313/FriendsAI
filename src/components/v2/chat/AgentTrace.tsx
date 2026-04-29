"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import type { AgentStep } from "./types";

interface AgentTraceProps {
  steps: AgentStep[];
  /** When true, shows a small collapsed summary you can toggle open. */
  collapsed?: boolean;
}

/**
 * Renders the trace of agent steps under (or before) an assistant message.
 * Used in two places:
 *  - Live, while streaming: caller renders steps + AgentStatus indicator separately.
 *  - Collapsed under a completed message: this component, which shows
 *    "Used 4 tools · 3.2s" and expands to a list on click.
 */
export function AgentTrace({ steps, collapsed = false }: AgentTraceProps) {
  const [open, setOpen] = React.useState(!collapsed);
  const totalMs = steps.reduce((acc, s) => acc + (s.durationMs ?? 0), 0);

  return (
    <div className="mb-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "v2-press inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1",
          "text-[11.5px] text-white/60 transition-colors hover:text-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        )}
      >
        <SparkIcon />
        <span>
          Used {steps.length} {steps.length === 1 ? "step" : "steps"}
          {totalMs > 0 && (
            <span className="text-white/40"> · {(totalMs / 1000).toFixed(1)}s</span>
          )}
        </span>
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            key="trace"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 overflow-hidden"
          >
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
              {steps.map((s, i) => (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-start gap-3 py-1.5",
                    i !== 0 && "border-t border-white/[0.04]"
                  )}
                >
                  <StepIcon step={s} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="v2-font-sans text-[12.5px] font-medium text-white/80">
                        {s.label}
                      </span>
                      {typeof s.durationMs === "number" && (
                        <span className="text-[11px] text-white/35">
                          {(s.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    {s.detail && (
                      <p className="v2-font-sans truncate text-[12px] text-white/45">
                        {s.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepIcon({ step }: { step: AgentStep }) {
  const tone =
    step.status === "error"
      ? "text-rose-300 bg-rose-400/10 ring-rose-400/20"
      : step.status === "active"
      ? "text-cyan-300 bg-cyan-400/10 ring-cyan-400/20"
      : "text-white/65 bg-white/[0.04] ring-white/10";
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ring-1",
        tone
      )}
    >
      <KindIcon kind={step.kind} />
    </span>
  );
}

function KindIcon({ kind }: { kind: AgentStep["kind"] }) {
  switch (kind) {
    case "search":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <circle cx="4.3" cy="4.3" r="2.8" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6.3 6.3L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "fetch":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.1" />
          <path d="M1.5 5h7M5 1.5c1 1 1.5 2 1.5 3.5S6 8.5 5 8.5M5 1.5c-1 1-1.5 2-1.5 3.5S4 8.5 5 8.5" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case "memory":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M2 3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3zM2 5h6" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    case "image":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <rect x="1.2" y="1.5" width="7.6" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="3.5" cy="4" r="0.8" fill="currentColor" />
          <path d="M1.5 7l2-2 2 2 1.5-1.5L8.5 7" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    case "voice":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <rect x="3.8" y="1.2" width="2.4" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
          <path d="M2 5a3 3 0 0 0 6 0M5 8.2v1.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
    case "route":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <circle cx="2" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="8" cy="2.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="8" cy="7.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <path d="M3.2 5L7 2.5M3.2 5L7 7.5" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case "tool":
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M2 8l3-3M5 5a2 2 0 1 1 3-3 2 2 0 0 1-3 3z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    case "thinking":
    default:
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.1" />
          <path d="M5 3v2.2L6.4 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
  }
}

function SparkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path
        d="M5.5 0.5l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 9 9"
      fill="none"
      aria-hidden
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <path
        d="M2 3l2.5 2.5L7 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
