"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERSONAS } from "@/lib/chat/personas";
import type { BuddyPersona } from "@/models/userModel";
import type { TranscriptTurn } from "@/app/live_talk/page";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  persona: BuddyPersona;
  isModelSpeaking: boolean;
  audioLevel: number;
  transcripts: TranscriptTurn[];
}

/**
 * Right-side panel — mounts as an overlay on the right edge. Two stacked
 * cards: ParticipantsList (top, fixed-height) + ChatLog (bottom, scrolls).
 */
export default function SidePanel({
  open,
  onClose,
  persona,
  isModelSpeaking,
  audioLevel,
  transcripts,
}: SidePanelProps) {
  return (
    <motion.aside
      initial={false}
      animate={{
        width: open ? 340 : 0,
        opacity: open ? 1 : 0,
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute top-0 right-0 bottom-0 z-20 overflow-hidden pointer-events-none"
    >
      <div
        className={cn(
          "h-full w-[340px] flex flex-col gap-3 p-3 ml-auto",
          "bg-zinc-950/85 border-l border-white/10 backdrop-blur-2xl",
          "pointer-events-auto"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <h3 className="text-sm font-semibold text-zinc-200 tracking-wide">Meeting</h3>
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 transition-colors"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Participants */}
        <ParticipantsCard
          persona={persona}
          isModelSpeaking={isModelSpeaking}
          audioLevel={audioLevel}
        />

        {/* Chat log */}
        <ChatLog persona={persona} transcripts={transcripts} />
      </div>
    </motion.aside>
  );
}

// ─── Participants ────────────────────────────────────────────────────────────

function ParticipantsCard({
  persona,
  isModelSpeaking,
  audioLevel,
}: {
  persona: BuddyPersona;
  isModelSpeaking: boolean;
  audioLevel: number;
}) {
  const { data: session } = useSession();
  const personaCard = PERSONAS[persona];
  const userName = session?.user?.name ?? session?.user?.email ?? "You";
  const userImage = session?.user?.image ?? null;

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2.5">
        Participants — 2
      </p>
      <div className="space-y-2">
        {/* AI */}
        <ParticipantRow
          avatar={
            <div
              className="size-9 rounded-full flex items-center justify-center text-base"
              style={{
                background: `linear-gradient(135deg, ${glowToHex(personaCard?.glow ?? "indigo")}66, ${glowToHex(personaCard?.glow ?? "indigo")}22)`,
                border: `1px solid ${glowToHex(personaCard?.glow ?? "indigo")}55`,
              }}
            >
              {personaCard?.emoji}
            </div>
          }
          name={personaCard?.name ?? "AI"}
          subtitle={personaCard?.description}
          isSpeaking={isModelSpeaking}
        />
        {/* User */}
        <ParticipantRow
          avatar={
            userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={userName}
                referrerPolicy="no-referrer"
                className="size-9 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-1 ring-white/10">
                {userName[0]?.toUpperCase() ?? "U"}
              </div>
            )
          }
          name={userName}
          subtitle="You"
          isSpeaking={!isModelSpeaking && audioLevel > 18}
        />
      </div>
    </div>
  );
}

function ParticipantRow({
  avatar,
  name,
  subtitle,
  isSpeaking,
}: {
  avatar: React.ReactNode;
  name: string;
  subtitle?: string;
  isSpeaking: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors",
        isSpeaking ? "bg-emerald-500/10" : "bg-transparent"
      )}
    >
      <div className="relative shrink-0">
        {avatar}
        {isSpeaking && (
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center">
            <Mic className="size-2 text-white" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{name}</p>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── Chat log ────────────────────────────────────────────────────────────────

function ChatLog({
  persona,
  transcripts,
}: {
  persona: BuddyPersona;
  transcripts: TranscriptTurn[];
}) {
  const personaCard = PERSONAS[persona];
  const accent = glowToHex(personaCard?.glow ?? "indigo");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new turn.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [transcripts.length]);

  return (
    <div className="flex-1 min-h-0 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold p-3 pb-2">
        Live transcript
      </p>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 no-scrollbar">
        {transcripts.length === 0 && (
          <p className="text-xs text-zinc-600 italic px-2">
            Speak to start the conversation. Transcripts appear here.
          </p>
        )}
        {transcripts.map((t) => (
          <ChatBubble key={t.id} turn={t} aiAccent={accent} aiEmoji={personaCard?.emoji} />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({
  turn,
  aiAccent,
  aiEmoji,
}: {
  turn: TranscriptTurn;
  aiAccent: string;
  aiEmoji?: string;
}) {
  const isUser = turn.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div
          className="size-7 shrink-0 rounded-full flex items-center justify-center text-sm mt-0.5"
          style={{
            background: `${aiAccent}22`,
            border: `1px solid ${aiAccent}55`,
          }}
        >
          {aiEmoji ?? "🤖"}
        </div>
      )}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-sm font-light leading-snug",
          isUser
            ? "bg-indigo-500/15 text-indigo-50 border border-indigo-400/20 rounded-tr-md"
            : "bg-white/[0.05] text-zinc-100 border border-white/5 rounded-tl-md"
        )}
        style={{
          // Subtle text shadow per spec.
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
        }}
      >
        {turn.content}
      </div>
    </motion.div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function glowToHex(glow: string): string {
  switch (glow) {
    case "indigo":  return "#6366f1";
    case "emerald": return "#10b981";
    case "amber":   return "#f59e0b";
    case "cyan":    return "#06b6d4";
    case "purple":  return "#8b5cf6";
    case "rose":    return "#f43f5e";
    case "teal":    return "#14b8a6";
    default:        return "#6366f1";
  }
}
