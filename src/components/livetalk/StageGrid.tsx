"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import AvatarRenderer from "@/components/avatar/AvatarRenderer";
import UserCameraTile from "./UserCameraTile";
import { PERSONAS } from "@/lib/chat/personas";
import type { BuddyPersona } from "@/models/userModel";
import type { Expression, PersonaGlow } from "@/components/chatComponents/LiveTalkOverlay";

export type StageMode = "sphere" | "avatar";

interface StageGridProps {
  /** Current AI persona — drives avatar URL, name plate, glow color. */
  persona: BuddyPersona;
  /** Sphere or avatar — toggle from BottomBar. */
  stageMode: StageMode;
  /** TTS audio amplitude during AI speech (0-100). */
  outputAudioLevel: number;
  /** Mic-input amplitude (0-100) — drives user tile speaking ring. */
  audioLevel: number;
  /** True while AI is producing audio. */
  isModelSpeaking: boolean;
  /** Detected facial expression from MediaPipe. */
  expression: Expression;
  /** From useLiveAudio — the live MediaStream when camera is on. */
  videoStream: MediaStream | null;
  /** Latest user STT, displayed as a caption strip while transcribing. */
  userTranscript: string;
  /** Streaming AI text — displayed as a caption strip while AI speaks. */
  aiResponse: string;
  /** Phase label for status pill (Listening / Thinking / etc). */
  phaseLabel: string;
}

/**
 * Zoom-style main stage. The AI fills the canvas; the user's self-view is a
 * draggable picture-in-picture tile in the top-right (Zoom default position).
 */
export default function StageGrid({
  persona,
  stageMode,
  outputAudioLevel,
  audioLevel,
  isModelSpeaking,
  expression,
  videoStream,
  userTranscript,
  aiResponse,
  phaseLabel,
}: StageGridProps) {
  const personaCard = PERSONAS[persona];
  const personaGlow: PersonaGlow = (personaCard?.glow ?? "indigo") as PersonaGlow;

  return (
    <div className="relative size-full overflow-hidden">
      {/* Subtle radial bg tinted by persona */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 35%, ${glowToTint(personaGlow)} 0%, transparent 65%), #050507`,
        }}
      />

      {/* AI tile fills the stage */}
      <div className="relative size-full flex items-center justify-center">
        {stageMode === "avatar" ? (
          <div className="size-full max-w-5xl mx-auto">
            <AvatarRenderer
              audioLevel={isModelSpeaking ? outputAudioLevel : 0}
              speaking={isModelSpeaking}
              expression={expression}
              personaGlow={personaGlow}
              avatarUrl={personaCard?.avatarUrl}
            />
          </div>
        ) : (
          <SphereStage
            audioLevel={isModelSpeaking ? outputAudioLevel : audioLevel}
            speaking={isModelSpeaking}
            personaGlow={personaGlow}
          />
        )}

        {/* Persona name plate (Zoom-style, bottom-left of AI tile) */}
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/5">
            <span className="text-base">{personaCard?.emoji}</span>
            <span className="text-sm font-semibold text-white">{personaCard?.name ?? "AI"}</span>
            <span
              className={cn(
                "ml-2 size-2 rounded-full",
                isModelSpeaking ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
              )}
            />
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-300">
              {phaseLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Captions strip (bottom of stage) — shows latest turn */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 max-w-2xl w-[90%]">
        <AnimatePresence mode="wait">
          {isModelSpeaking || aiResponse ? (
            <motion.div
              key="ai-cap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-2.5 bg-black/65 backdrop-blur-md border border-white/5 text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80 font-bold mb-0.5">
                {personaCard?.name ?? "AI"}
              </p>
              <p className="text-sm leading-snug text-zinc-100 font-light">
                {aiResponse || "…"}
              </p>
            </motion.div>
          ) : userTranscript ? (
            <motion.div
              key="user-cap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-2.5 bg-black/65 backdrop-blur-md border border-white/5 text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-0.5">
                You
              </p>
              <p className="text-sm leading-snug text-zinc-200 font-light">{userTranscript}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Self-view tile (Zoom default: top-right, draggable) */}
      <UserCameraTile stream={videoStream} name="You" audioLevel={audioLevel} />
    </div>
  );
}

// ─── Inline sphere fallback (lighter than full LiveTalkOverlay) ──────────────

function SphereStage({
  audioLevel,
  speaking,
  personaGlow,
}: {
  audioLevel: number;
  speaking: boolean;
  personaGlow: PersonaGlow;
}) {
  const scale = 1 + (audioLevel / 100) * 0.18;
  const color = glowToHex(personaGlow);
  return (
    <motion.div
      animate={{ scale }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="relative size-[340px] md:size-[420px]"
    >
      <div
        className="absolute -inset-12 rounded-full blur-3xl opacity-60"
        style={{ background: `radial-gradient(circle, ${color}55, transparent 70%)` }}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: speaking ? 6 : 12, ease: "linear" }}
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: `conic-gradient(from 0deg, ${color}, ${color}cc, ${color})`,
          filter: "blur(6px) saturate(1.4)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.45) 0%, transparent 55%)",
        }}
      />
    </motion.div>
  );
}

// ─── Pure helpers ────────────────────────────────────────────────────────────

function glowToHex(glow: PersonaGlow): string {
  switch (glow) {
    case "indigo":  return "#6366f1";
    case "emerald": return "#10b981";
    case "amber":   return "#f59e0b";
    case "cyan":    return "#06b6d4";
    case "purple":  return "#8b5cf6";
    case "rose":    return "#f43f5e";
    case "teal":    return "#14b8a6";
    case "slate":   return "#64748b";
  }
}
function glowToTint(glow: PersonaGlow): string {
  return `${glowToHex(glow)}1a`; // ~10% alpha tint
}
