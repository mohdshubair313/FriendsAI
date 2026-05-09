"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPersona, savePersona, loadPersona } from "@/store/slices/personaSlice";
import { PERSONAS, PERSONA_KEYS } from "@/lib/chat/personas";
import type { BuddyPersona } from "@/models/userModel";
import { cn } from "@/lib/utils";

const GLOW_RING: Record<string, string> = {
  indigo:  "bg-indigo-500/15 border-indigo-400/50 text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.35)]",
  emerald: "bg-emerald-500/15 border-emerald-400/50 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.35)]",
  amber:   "bg-amber-500/15 border-amber-400/50 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.35)]",
  cyan:    "bg-cyan-500/15 border-cyan-400/50 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.35)]",
  purple:  "bg-purple-500/15 border-purple-400/50 text-purple-200 shadow-[0_0_18px_rgba(139,92,246,0.35)]",
  rose:    "bg-rose-500/15 border-rose-400/50 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.35)]",
  teal:    "bg-teal-500/15 border-teal-400/50 text-teal-200 shadow-[0_0_18px_rgba(20,184,166,0.35)]",
  slate:   "bg-slate-500/15 border-slate-400/50 text-slate-200",
};

const INACTIVE =
  "bg-white/[0.03] text-zinc-400 border-white/10 hover:border-white/25 hover:text-zinc-200";

interface PersonaSelectorProps {
  /** Compact form (smaller padding, tighter font) — used inside LiveTalkOverlay. */
  compact?: boolean;
  /** Called whenever a new persona is selected (after redux update). */
  onChange?: (next: BuddyPersona) => void;
}

export default function PersonaSelector({ compact, onChange }: PersonaSelectorProps) {
  const dispatch = useAppDispatch();
  const selected = useAppSelector((s) => s.persona.selected);
  const status = useAppSelector((s) => s.persona.status);

  // Load the user's saved persona on first mount.
  useEffect(() => {
    if (status === "idle") void dispatch(loadPersona());
  }, [status, dispatch]);

  const handlePick = (key: BuddyPersona) => {
    if (key === selected) return;
    dispatch(setPersona(key));     // optimistic local update
    void dispatch(savePersona(key)); // fire-and-forget persist
    onChange?.(key);
  };

  return (
    <div
      className={cn(
        "flex gap-2 flex-wrap items-center",
        compact ? "justify-start" : "justify-center px-4 py-2"
      )}
    >
      {PERSONA_KEYS.map((key) => {
        const p = PERSONAS[key];
        const isActive = selected === key;
        return (
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.04 }}
            key={key}
            type="button"
            onClick={() => handlePick(key)}
            title={p.description}
            className={cn(
              "flex items-center gap-1.5 rounded-full border transition-all duration-200 font-medium",
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
              isActive ? GLOW_RING[p.glow] ?? GLOW_RING.indigo : INACTIVE
            )}
          >
            <span className="text-base leading-none">{p.emoji}</span>
            <span>{p.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
