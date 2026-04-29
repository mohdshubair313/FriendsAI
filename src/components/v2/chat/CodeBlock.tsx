"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";

interface CodeBlockProps {
  language?: string;
  children: React.ReactNode;
  /** The raw string content for copy. */
  rawText: string;
  className?: string;
}

/**
 * Code block in Linear / Claude house style:
 * monochrome, mono-typeset, copy in the corner, language tag flush-left.
 */
export function CodeBlock({
  language,
  children,
  rawText,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const lang = (language || "code").toLowerCase();

  return (
    <div
      className={cn(
        "group/code relative my-4 overflow-hidden rounded-2xl",
        "border border-white/[0.08] bg-[#070709]",
        // Inner ring + shadow for depth
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_28px_-12px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Mac-style traffic dots, but quietly tinted */}
          <span aria-hidden className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/10" />
            <span className="h-2 w-2 rounded-full bg-white/[0.06]" />
          </span>
          <span className="ml-1 v2-font-sans text-[11px] uppercase tracking-[0.16em] text-white/45">
            {lang}
          </span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className={cn(
            "v2-press inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px]",
            "text-white/55 transition-colors duration-200 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-1.5"
              >
                <CheckIcon />
                <span>Copied</span>
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-1.5"
              >
                <CopyIcon />
                <span>Copy</span>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Body */}
      <pre className="relative max-h-[60vh] overflow-x-auto px-5 py-4 text-[13px] leading-[1.65] text-white/85">
        <code className="font-mono text-[12.5px] [tab-size:2]">{children}</code>
      </pre>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M5 1.5h5.5A1.5 1.5 0 0 1 12 3v5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M3 6.8l2.5 2.5L10 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-300"
      />
    </svg>
  );
}
