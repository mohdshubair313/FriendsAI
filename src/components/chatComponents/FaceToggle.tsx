"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaceToggleProps {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  /** Disabled state — shown grey-out + tooltip explaining why. */
  disabled?: boolean;
  disabledReason?: string;
}

export default function FaceToggle({
  enabled,
  onToggle,
  disabled,
  disabledReason,
}: FaceToggleProps) {
  return (
    <button
      onClick={() => !disabled && onToggle(!enabled)}
      disabled={disabled}
      title={
        disabled
          ? disabledReason ?? "Face detection unavailable"
          : enabled
          ? "Face on — AI can see your expressions"
          : "Face off — only your voice is processed"
      }
      className={cn(
        "size-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
        disabled
          ? "bg-white/[0.02] border-white/5 text-zinc-700 cursor-not-allowed"
          : enabled
          ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/25"
          : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
      )}
      aria-label={enabled ? "Disable face detection" : "Enable face detection"}
    >
      {enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </button>
  );
}
