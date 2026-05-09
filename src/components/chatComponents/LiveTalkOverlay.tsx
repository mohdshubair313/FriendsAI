"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, AudioWaveform, ChevronLeft, RotateCcw, Globe, Orbit, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import FaceToggle from "./FaceToggle";
import PersonaSelector from "./PersonaSelector";
import LocaleSelector from "@/components/profile/LocaleSelector";
import AvatarRenderer from "@/components/avatar/AvatarRenderer";

type StageMode = "sphere" | "avatar";

export type VoicePhase = "idle" | "listening" | "transcribing" | "thinking" | "speaking";
export type Expression = "neutral" | "smiling" | "frowning" | "surprised" | "thinking" | "nodding";
export type PersonaGlow = "indigo" | "emerald" | "amber" | "cyan" | "purple" | "rose" | "teal" | "slate";

interface LiveTalkOverlayProps {
  phase: VoicePhase;
  isModelSpeaking: boolean;
  audioLevel: number;          // 0-100, mic input
  outputAudioLevel: number;    // 0-100, AI TTS envelope
  userTranscript: string;      // last STT result
  aiResponse: string;          // streaming AI text
  expression: Expression;      // current detected facial expression
  faceEnabled: boolean;        // is face detection currently on
  onToggleFace: (next: boolean) => void;
  /** Active persona's glow palette key — overrides the sphere base color. */
  personaGlow?: PersonaGlow;
  onClose: () => void;
  onInterrupt: () => void;
}

const PHASE_TEXT: Record<VoicePhase, string> = {
  idle: "Connecting…",
  listening: "Psst… Speak up, I'm listening",
  transcribing: "Catching your words…",
  thinking: "Thinking…",
  speaking: "I'm talking — tap mic to interrupt",
};

export default function LiveTalkOverlay({
  phase,
  isModelSpeaking,
  audioLevel,
  outputAudioLevel,
  userTranscript,
  aiResponse,
  expression,
  faceEnabled,
  onToggleFace,
  personaGlow = "indigo",
  onClose,
  onInterrupt,
}: LiveTalkOverlayProps) {
  const [showLocale, setShowLocale] = useState(false);

  // Stage mode toggle. Persisted so the user's preference survives refresh.
  // Defaults to sphere — lighter on the GPU and looks great. Avatar is the
  // optional "I want a face" mode.
  const [stageMode, setStageMode] = useState<StageMode>("sphere");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("livetalk:stage");
    if (stored === "avatar" || stored === "sphere") setStageMode(stored);
  }, []);
  const handleToggleStage = () => {
    const next: StageMode = stageMode === "sphere" ? "avatar" : "sphere";
    setStageMode(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("livetalk:stage", next);
    }
  };

  // Sphere reacts to whichever side is active.
  const reactiveLevel = isModelSpeaking ? outputAudioLevel : audioLevel;
  // 1 → idle pulse, scales up to 1.18 at max input.
  const sphereScale = 1 + (reactiveLevel / 100) * 0.18;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden">
      {/* Subtle ambient noise / grain */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
      {/* Emerald ambient glow at center, intensifies with audio */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 45%, rgba(16, 185, 129, ${0.08 + (reactiveLevel / 100) * 0.18}) 0%, transparent 60%)`,
        }}
      />

      {/* ─── Header ───────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <button
          onClick={onClose}
          className="size-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 transition-all active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>

        <h1 className="text-base font-semibold text-zinc-200 tracking-wide">
          Friends LiveTalk
        </h1>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={handleToggleStage}
            className="size-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 transition-all active:scale-95"
            aria-label="Toggle stage mode"
            title={stageMode === "sphere" ? "Switch to avatar" : "Switch to sphere"}
          >
            {stageMode === "sphere" ? <UserIcon className="size-4" /> : <Orbit className="size-4" />}
          </button>
          <button
            onClick={() => setShowLocale((s) => !s)}
            className={cn(
              "size-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
              showLocale
                ? "bg-indigo-500/15 border-indigo-400/40 text-indigo-200"
                : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
            )}
            aria-label="Language settings"
            title="Country / language"
          >
            <Globe className="size-4" />
          </button>
          <FaceToggle enabled={faceEnabled} onToggle={onToggleFace} />
          <button
            onClick={onInterrupt}
            className="size-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 transition-all active:scale-95"
            aria-label="Reset turn"
            title="Interrupt / reset"
          >
            <RotateCcw className="size-4" />
          </button>

          <AnimatePresence>
            {showLocale && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 right-0 z-30 p-3 rounded-xl bg-zinc-950/95 border border-white/10 backdrop-blur-xl shadow-2xl"
              >
                <LocaleSelector compact />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ─── Phase headline ──────────────────────────────────── */}
      <div className="relative z-10 px-8 pt-6 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-2xl md:text-3xl font-light tracking-tight text-white/95"
          >
            {PHASE_TEXT[phase]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ─── Stage (sphere OR avatar) ────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        {stageMode === "sphere" ? (
          <Sphere
            scale={sphereScale}
            active={phase !== "idle"}
            speaking={isModelSpeaking}
            expression={expression}
            personaGlow={personaGlow}
          />
        ) : (
          <div className="size-[340px] md:size-[420px]">
            <AvatarRenderer
              audioLevel={isModelSpeaking ? outputAudioLevel : 0}
              speaking={isModelSpeaking}
              expression={expression}
              personaGlow={personaGlow}
            />
          </div>
        )}
      </div>

      {/* ─── Persona quick-switch (compact) ──────────────────── */}
      <div className="relative z-10 flex justify-center px-4 pt-2">
        <PersonaSelector compact />
      </div>

      {/* ─── Detected expression chip (only when face is on + non-neutral) ─ */}
      {faceEnabled && expression !== "neutral" && (
        <div className="relative z-10 flex justify-center">
          <motion.div
            key={expression}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] uppercase tracking-widest font-bold text-zinc-300"
          >
            <span>👁</span>
            <span>{expression}</span>
          </motion.div>
        </div>
      )}

      {/* ─── Live transcript area ────────────────────────────── */}
      <div className="relative z-10 px-8 pb-32 min-h-[120px]">
        <AnimatePresence mode="wait">
          {isModelSpeaking || aiResponse ? (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70 mb-2 font-bold">
                Friends AI
              </p>
              <p className="text-base md:text-lg leading-relaxed text-zinc-300 font-light">
                {aiResponse || "…"}
              </p>
            </motion.div>
          ) : userTranscript ? (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-2 font-bold">
                You said
              </p>
              <p className="text-base md:text-lg leading-relaxed text-zinc-200 font-light">
                {userTranscript}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ─── Bottom controls ─────────────────────────────────── */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center gap-6">
        {/* Mini level meter */}
        <button
          className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400"
          aria-label="Audio level"
        >
          <AudioWaveform className="size-5" />
        </button>

        {/* Big mic — pulsing while listening */}
        <button
          onClick={onInterrupt}
          className={cn(
            "relative size-20 rounded-full flex items-center justify-center transition-all active:scale-95",
            phase === "listening"
              ? "bg-emerald-500/15 border-2 border-emerald-400/60 text-emerald-300"
              : phase === "speaking"
              ? "bg-rose-500/15 border-2 border-rose-400/60 text-rose-300"
              : "bg-white/5 border-2 border-white/15 text-zinc-400"
          )}
          aria-label={phase === "speaking" ? "Interrupt AI" : "Listening"}
        >
          {phase === "listening" && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
          )}
          <Mic className="size-7 relative z-10" />
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="size-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 transition-all active:scale-95"
          aria-label="End session"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Sphere (CSS-only, audio-reactive) ────────────────────────────────────────

// Color palette per expression. Speaking always wins (it's the most active
// state) so we only consult expression when AI isn't currently talking.
const EXPRESSION_PALETTE: Record<Expression, { core: string; halo: string; mid: string; aux: string }> = {
  neutral:   { core: "#10b981", halo: "rgba(16, 185, 129, 0.45)",  mid: "rgba(52, 211, 153, 0.55)", aux: "#6ee7b7" },
  smiling:   { core: "#22c55e", halo: "rgba(34, 197, 94, 0.55)",   mid: "rgba(74, 222, 128, 0.6)",  aux: "#86efac" },
  surprised: { core: "#06b6d4", halo: "rgba(6, 182, 212, 0.55)",   mid: "rgba(34, 211, 238, 0.6)",  aux: "#67e8f9" },
  frowning:  { core: "#f59e0b", halo: "rgba(245, 158, 11, 0.5)",   mid: "rgba(251, 191, 36, 0.55)", aux: "#fcd34d" },
  thinking:  { core: "#8b5cf6", halo: "rgba(139, 92, 246, 0.5)",   mid: "rgba(167, 139, 250, 0.55)", aux: "#c4b5fd" },
  nodding:   { core: "#10b981", halo: "rgba(16, 185, 129, 0.5)",   mid: "rgba(52, 211, 153, 0.6)",  aux: "#6ee7b7" },
};
const SPEAKING_PALETTE = { core: "#f43f5e", halo: "rgba(244, 63, 94, 0.4)", mid: "rgba(251, 113, 133, 0.5)", aux: "#fda4af" };

// Persona-tinted neutral palettes — used when no expression is detected
// and the AI isn't speaking. Lets each character have its own resting hue.
const PERSONA_PALETTE: Record<PersonaGlow, { core: string; halo: string; mid: string; aux: string }> = {
  indigo:  { core: "#6366f1", halo: "rgba(99, 102, 241, 0.45)",  mid: "rgba(129, 140, 248, 0.55)", aux: "#a5b4fc" },
  emerald: EXPRESSION_PALETTE.neutral,
  amber:   { core: "#f59e0b", halo: "rgba(245, 158, 11, 0.45)",  mid: "rgba(251, 191, 36, 0.55)",  aux: "#fcd34d" },
  cyan:    { core: "#06b6d4", halo: "rgba(6, 182, 212, 0.45)",   mid: "rgba(34, 211, 238, 0.55)",  aux: "#67e8f9" },
  purple:  { core: "#8b5cf6", halo: "rgba(139, 92, 246, 0.45)",  mid: "rgba(167, 139, 250, 0.55)", aux: "#c4b5fd" },
  rose:    { core: "#f43f5e", halo: "rgba(244, 63, 94, 0.45)",   mid: "rgba(251, 113, 133, 0.55)", aux: "#fda4af" },
  teal:    { core: "#14b8a6", halo: "rgba(20, 184, 166, 0.45)",  mid: "rgba(45, 212, 191, 0.55)",  aux: "#5eead4" },
  slate:   { core: "#64748b", halo: "rgba(100, 116, 139, 0.45)", mid: "rgba(148, 163, 184, 0.55)", aux: "#cbd5e1" },
};

function Sphere({
  scale,
  active,
  speaking,
  expression,
  personaGlow,
}: {
  scale: number;
  active: boolean;
  speaking: boolean;
  expression: Expression;
  personaGlow: PersonaGlow;
}) {
  // Priority: speaking > non-neutral expression > persona glow.
  // The persona's color is the resting/idle hue; expression overrides
  // momentarily; AI speaking always overrides everything (rose alert).
  const palette = speaking
    ? SPEAKING_PALETTE
    : expression !== "neutral"
    ? EXPRESSION_PALETTE[expression]
    : PERSONA_PALETTE[personaGlow];

  return (
    <motion.div
      animate={{ scale }}
      transition={{ type: "spring", stiffness: 200, damping: 18, mass: 0.5 }}
      className="relative size-[280px] md:size-[340px]"
    >
      {/* Outer halo glow */}
      <div
        className="absolute -inset-12 rounded-full blur-3xl opacity-60 transition-colors duration-700"
        style={{ background: `radial-gradient(circle, ${palette.halo}, transparent 70%)` }}
      />

      {/* Mid soft glow */}
      <div
        className="absolute -inset-4 rounded-full blur-2xl opacity-80 transition-colors duration-700"
        style={{ background: `radial-gradient(circle, ${palette.mid}, transparent 65%)` }}
      />

      {/* Core sphere — rotating conic gradient gives the swirl effect */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: speaking ? 6 : 12, ease: "linear" }}
        className="absolute inset-0 rounded-full overflow-hidden transition-all duration-700"
        style={{
          background: `conic-gradient(from 0deg, ${palette.core}, ${palette.aux}, ${palette.core})`,
          filter: "blur(6px) saturate(1.4)",
        }}
      />

      {/* Counter-rotating layer for depth */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: speaking ? 9 : 18, ease: "linear" }}
        className="absolute inset-3 rounded-full overflow-hidden mix-blend-screen opacity-70 transition-all duration-700"
        style={{
          background: `conic-gradient(from 180deg, transparent, ${palette.aux}, transparent, ${palette.core}, transparent)`,
          filter: "blur(10px)",
        }}
      />

      {/* Glassy highlight for 3D feel */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.08) 22%, transparent 55%)",
        }}
      />

      {/* Subtle inner darkening for depth */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 60% 80%, rgba(0, 0, 0, 0.55) 0%, transparent 55%)",
        }}
      />

      {/* Idle gentle pulse so the sphere never looks dead */}
      {!active && (
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border border-emerald-400/20"
        />
      )}
    </motion.div>
  );
}
