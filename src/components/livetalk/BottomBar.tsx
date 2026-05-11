"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Globe,
  Users,
  Phone,
  Orbit,
  User as UserIcon,
  Sparkles,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PersonaSelector from "@/components/chatComponents/PersonaSelector";
import LocaleSelector from "@/components/profile/LocaleSelector";
import type { StageMode } from "./StageGrid";

interface BottomBarProps {
  micMuted: boolean;
  onToggleMic: () => void;
  cameraEnabled: boolean;
  onToggleCamera: (next: boolean) => void;
  stageMode: StageMode;
  onToggleStage: () => void;
  sidePanelOpen: boolean;
  onToggleSidePanel: () => void;
  /** Opens the onboarding wizard (country/language/voice/role re-pick). */
  onReconfigure?: () => void;
  onLeave: () => void;
}

/**
 * Zoom-style control strip — pinned to the bottom of MeetView.
 * Glass tokens with soft persona-agnostic indigo backlight on actives.
 */
export default function BottomBar({
  micMuted,
  onToggleMic,
  cameraEnabled,
  onToggleCamera,
  stageMode,
  onToggleStage,
  sidePanelOpen,
  onToggleSidePanel,
  onReconfigure,
  onLeave,
}: BottomBarProps) {
  const [showPersona, setShowPersona] = useState(false);
  const [showLocale, setShowLocale] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center pb-5 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)]"
      >
        {/* Mic */}
        <ControlButton
          label={micMuted ? "Unmute" : "Mute"}
          active={!micMuted}
          danger={micMuted}
          icon={micMuted ? MicOff : Mic}
          onClick={onToggleMic}
        />

        {/* Camera */}
        <ControlButton
          label={cameraEnabled ? "Stop video" : "Start video"}
          active={cameraEnabled}
          danger={!cameraEnabled}
          icon={cameraEnabled ? Camera : CameraOff}
          onClick={() => onToggleCamera(!cameraEnabled)}
        />

        <Divider />

        {/* Persona picker (popover up) */}
        <div className="relative">
          <ControlButton
            label="Persona"
            active={showPersona}
            icon={Sparkles}
            onClick={() => { setShowPersona((s) => !s); setShowLocale(false); }}
          />
          <AnimatePresence>
            {showPersona && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-zinc-950/95 border border-white/10 backdrop-blur-xl shadow-2xl min-w-[280px] max-w-[420px]"
              >
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 px-1">
                  Choose your AI
                </p>
                <PersonaSelector compact />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Locale (popover up) */}
        <div className="relative">
          <ControlButton
            label="Language"
            active={showLocale}
            icon={Globe}
            onClick={() => { setShowLocale((s) => !s); setShowPersona(false); }}
          />
          <AnimatePresence>
            {showLocale && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-zinc-950/95 border border-white/10 backdrop-blur-xl shadow-2xl"
              >
                <LocaleSelector compact />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stage mode toggle */}
        <ControlButton
          label={stageMode === "sphere" ? "Show avatar" : "Show sphere"}
          icon={stageMode === "sphere" ? UserIcon : Orbit}
          onClick={onToggleStage}
        />

        <Divider />

        {/* Side panel */}
        <ControlButton
          label="Participants"
          active={sidePanelOpen}
          icon={Users}
          onClick={onToggleSidePanel}
        />

        {onReconfigure && (
          <ControlButton
            label="Reconfigure (country / language / role)"
            icon={Settings2}
            onClick={onReconfigure}
          />
        )}

        <Divider />

        {/* Leave (red) */}
        <button
          onClick={onLeave}
          className="ml-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-rose-500/30"
        >
          <Phone className="size-4 rotate-[135deg]" />
          Leave
        </button>
      </motion.div>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

interface ControlButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}

function ControlButton({ label, icon: Icon, onClick, active, danger }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "relative size-12 rounded-xl flex items-center justify-center transition-all active:scale-95",
        danger
          ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30"
          : active
          ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 shadow-[inset_0_0_18px_rgba(99,102,241,0.25)]"
          : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10"
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

function Divider() {
  return <span className="h-8 w-px bg-white/10" />;
}
