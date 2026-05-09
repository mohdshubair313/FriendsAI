"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import StageGrid, { type StageMode } from "./StageGrid";
import BottomBar from "./BottomBar";
import SidePanel from "./SidePanel";
import type { BuddyPersona } from "@/models/userModel";
import type { Expression } from "@/components/chatComponents/LiveTalkOverlay";
import type { TranscriptTurn } from "@/app/live_talk/page";

type VoicePhase = "idle" | "listening" | "transcribing" | "thinking" | "speaking";

const PHASE_LABEL: Record<VoicePhase, string> = {
  idle: "Connecting",
  listening: "Listening",
  transcribing: "Transcribing",
  thinking: "Thinking",
  speaking: "Speaking",
};

interface MeetViewProps {
  persona: BuddyPersona;
  phase: VoicePhase;
  isModelSpeaking: boolean;
  audioLevel: number;
  outputAudioLevel: number;
  expression: Expression;
  videoStream: MediaStream | null;
  userTranscript: string;
  aiResponse: string;
  transcripts: TranscriptTurn[];
  /** Camera on/off. Drives FaceToggle + getUserMedia video. */
  cameraEnabled: boolean;
  onToggleCamera: (next: boolean) => void;
  onClose: () => void;
  onInterrupt: () => void;
}

/**
 * Top-level Zoom/Meet-style layout. Swaps for the legacy LiveTalkOverlay.
 *
 * - Stage fills the viewport, persona avatar/sphere centered.
 * - User self-view PiP top-right (draggable).
 * - Bottom controls bar with persona/locale popovers.
 * - Right side panel collapsible (participants + chat log).
 * - Mic mute is purely visual today — VAD continues so we can re-arm
 *   the moment the user unmutes (no re-prompt for permission).
 */
export default function MeetView({
  persona,
  phase,
  isModelSpeaking,
  audioLevel,
  outputAudioLevel,
  expression,
  videoStream,
  userTranscript,
  aiResponse,
  transcripts,
  cameraEnabled,
  onToggleCamera,
  onClose,
  onInterrupt,
}: MeetViewProps) {
  // Stage mode (sphere ↔ avatar). Persisted across sessions.
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

  // Side panel — open by default on wide screens, closed on narrow.
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSidePanelOpen(window.innerWidth >= 1024);
  }, []);

  // Mic mute is visual-only — see comment above.
  const [micMuted, setMicMuted] = useState(false);

  // Wall-clock session timer (Zoom shows elapsed time top-left).
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = window.setInterval(() => setElapsedMs(Date.now() - start), 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-[#050507] flex overflow-hidden">
      {/* Stage area — shrinks when side panel opens */}
      <div className="relative flex-1 min-w-0">
        {/* Top-left clock + connection */}
        <div className="absolute top-5 left-5 z-30 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-300">
              Live
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/5">
            <Clock className="size-3 text-zinc-400" />
            <span className="text-[11px] font-mono font-medium text-zinc-300">
              {fmtElapsed(elapsedMs)}
            </span>
          </div>
        </div>

        <StageGrid
          persona={persona}
          stageMode={stageMode}
          outputAudioLevel={outputAudioLevel}
          audioLevel={audioLevel}
          isModelSpeaking={isModelSpeaking}
          expression={expression}
          videoStream={videoStream}
          userTranscript={userTranscript}
          aiResponse={aiResponse}
          phaseLabel={PHASE_LABEL[phase]}
        />

        <BottomBar
          micMuted={micMuted}
          onToggleMic={() => {
            // Visual-only flip; if AI is mid-sentence, treat as interrupt.
            if (!micMuted && isModelSpeaking) onInterrupt();
            setMicMuted((m) => !m);
          }}
          cameraEnabled={cameraEnabled}
          onToggleCamera={onToggleCamera}
          stageMode={stageMode}
          onToggleStage={handleToggleStage}
          sidePanelOpen={sidePanelOpen}
          onToggleSidePanel={() => setSidePanelOpen((s) => !s)}
          onLeave={onClose}
        />

        <AnimatePresence>
          {micMuted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-5 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs font-medium backdrop-blur-md"
            >
              You are muted — click the mic to unmute
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right side panel */}
      <SidePanel
        open={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        persona={persona}
        isModelSpeaking={isModelSpeaking}
        audioLevel={audioLevel}
        transcripts={transcripts}
      />
    </div>
  );
}

function fmtElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
