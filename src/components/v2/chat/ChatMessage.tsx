"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { ChatMarkdown } from "./ChatMarkdown";
import { AgentTrace } from "./AgentTrace";
import type { ChatMessage as ChatMessageT } from "./types";

interface ChatMessageProps {
  message: ChatMessageT;
  isLast?: boolean;
  onRegenerate?: () => void;
  userName?: string;
}

/**
 * Single message row.
 *
 * - User messages live in a subtle bordered glass pill, right-aligned, capped width.
 * - Assistant messages are flush to the canvas with no avatar — Claude/Linear pattern.
 *   The author label sits as a faint eyebrow above the body.
 * - Streaming bodies append a soft caret at the end and never reflow other messages.
 */
export function ChatMessage({
  message,
  isLast,
  onRegenerate,
  userName = "You",
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      aria-label={isUser ? `Your message` : `Assistant message`}
      className={cn(
        "group/m relative w-full",
        isUser ? "flex justify-end" : "flex justify-start"
      )}
    >
      {isUser ? (
        <UserBubble message={message} userName={userName} />
      ) : (
        <AssistantBlock
          message={message}
          isLast={!!isLast}
          onRegenerate={onRegenerate}
        />
      )}
    </motion.article>
  );
}

/* ------------------------------- USER ------------------------------- */

function UserBubble({
  message,
  userName,
}: {
  message: ChatMessageT;
  userName: string;
}) {
  return (
    <div className="flex max-w-[78%] flex-col items-end">
      <span className="v2-text-eyebrow mb-1.5 mr-1 text-white/40">
        {userName}
      </span>
      <div
        className={cn(
          "rounded-2xl rounded-tr-md px-4 py-3 text-[15px] leading-[1.6]",
          "v2-glass border-white/[0.08] text-white",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
        )}
      >
        {/* Attachments preview */}
        {message.attachments && message.attachments.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2" aria-label="Attached files">
            {message.attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[12px] text-white/75"
              >
                <PaperclipIcon />
                <span className="max-w-[160px] truncate">{a.name}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}

/* ----------------------------- ASSISTANT ---------------------------- */

function AssistantBlock({
  message,
  isLast,
  onRegenerate,
}: {
  message: ChatMessageT;
  isLast: boolean;
  onRegenerate?: () => void;
}) {
  return (
    <div className="flex w-full max-w-[820px] gap-4">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">
        <header className="mb-2 flex items-center gap-2">
          <span className="v2-text-eyebrow text-white/55">Friends</span>
          <span className="v2-text-eyebrow text-white/30">·</span>
          <span className="v2-text-eyebrow text-white/30">
            {formatTime(message.createdAt)}
          </span>
        </header>

        {/* Optional collapsed agent trace from a completed turn */}
        {message.agentSteps && message.agentSteps.length > 0 && !message.isStreaming && (
          <AgentTrace steps={message.agentSteps} collapsed />
        )}

        {/* Body */}
        <div className="relative">
          <ChatMarkdown content={message.content} />
          {message.isStreaming && (
            <span aria-label="Generating" className="v2-caret align-baseline" />
          )}
        </div>

        {/* Error banner */}
        {message.hasError && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[12.5px] text-rose-200">
            <ErrorIcon />
            Generation interrupted
          </div>
        )}

        {/* Hover actions — only on the last assistant message + done */}
        {isLast && !message.isStreaming && (
          <AssistantActions content={message.content} onRegenerate={onRegenerate} />
        )}
      </div>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div
      aria-hidden
      className="relative mt-0.5 grid h-7 w-7 shrink-0 place-items-center"
    >
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#6366f1,#22d3ee,#a855f7,#6366f1)] opacity-90 blur-[2px]" />
      <span className="absolute inset-[2px] rounded-full bg-[#070709]" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.55)]" />
    </div>
  );
}

function AssistantActions({
  content,
  onRegenerate,
}: {
  content: string;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="mt-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover/m:opacity-100 focus-within:opacity-100">
      <ActionBtn label={copied ? "Copied" : "Copy"} onClick={onCopy}>
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <CheckIcon />
            </motion.span>
          ) : (
            <motion.span
              key="c"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <CopyIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </ActionBtn>
      {onRegenerate && (
        <ActionBtn label="Regenerate" onClick={onRegenerate}>
          <RefreshIcon />
        </ActionBtn>
      )}
      <ActionBtn label="Good response">
        <ThumbUpIcon />
      </ActionBtn>
      <ActionBtn label="Bad response">
        <ThumbDownIcon />
      </ActionBtn>
    </div>
  );
}

function ActionBtn({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "v2-press inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px]",
        "text-white/45 transition-colors duration-200 hover:bg-white/[0.04] hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

/* ------------------------------ icons ------------------------------ */

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 1.5h5.5A1.5 1.5 0 0 1 12 3v5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M3 6.8l2.5 2.5L10 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M11 6.5a4.5 4.5 0 1 1-1.4-3.25M11 1.5V4H8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ThumbUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M2.5 6h2v5h-2zM4.5 6l1.7-3.6c.3-.6 1.2-.5 1.4.1l.4 1.7c.1.4.5.7.9.7H10c.7 0 1.2.6 1 1.3l-.7 3a1 1 0 0 1-1 .8H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function ThumbDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M2.5 7h2V2h-2zM4.5 7l1.7 3.6c.3.6 1.2.5 1.4-.1l.4-1.7c.1-.4.5-.7.9-.7H10c.7 0 1.2-.6 1-1.3l-.7-3A1 1 0 0 0 9.3 3H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function PaperclipIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M9.5 5L5.6 8.9a2 2 0 1 1-2.8-2.8l4.4-4.4a1.4 1.4 0 0 1 2 2L4.7 8.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
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

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
