"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CameraOff, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCameraTileProps {
  /** Same MediaStream that powers the audio analyser (videoTrack must exist). */
  stream: MediaStream | null;
  /** Display name shown bottom-left. */
  name: string;
  /** Voice activity from the analyser — drives the speaking ring. 0-100. */
  audioLevel: number;
  /** Mic muted indicator — purely visual; mic capture continues for VAD. */
  muted?: boolean;
  className?: string;
}

/**
 * Self-view tile à la Zoom / Meet.
 *
 * Mirrors the video horizontally so the user sees themselves the way
 * mirrors do (not the way the camera does), which feels more natural.
 * Outline pulses green when the user is speaking.
 */
export default function UserCameraTile({
  stream,
  name,
  audioLevel,
  muted,
  className,
}: UserCameraTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream && stream.active && stream.getVideoTracks().length > 0) {
      v.srcObject = stream;
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {/* autoplay edge case */});
      }
    } else {
      v.srcObject = null;
    }
  }, [stream]);

  const isSpeaking = audioLevel > 18;
  const hasVideo = !!(stream && stream.getVideoTracks().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      drag
      dragMomentum={false}
      dragConstraints={{ left: -800, right: 0, top: 0, bottom: 600 }}
      className={cn(
        "absolute top-6 right-6 z-30 w-56 aspect-video rounded-2xl overflow-hidden",
        "bg-zinc-950 border-2 backdrop-blur-xl shadow-2xl cursor-grab active:cursor-grabbing",
        "transition-colors duration-300",
        isSpeaking ? "border-emerald-400/70" : "border-white/10",
        className
      )}
      style={{
        boxShadow: isSpeaking
          ? "0 0 24px rgba(16, 185, 129, 0.45), 0 12px 32px rgba(0,0,0,0.5)"
          : "0 12px 32px rgba(0,0,0,0.5)",
      }}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="size-full object-cover"
          style={{ transform: "scaleX(-1)" /* mirror */ }}
        />
      ) : (
        <div className="size-full flex items-center justify-center bg-zinc-900">
          <CameraOff className="size-8 text-zinc-700" />
        </div>
      )}

      {/* Name plate */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md">
          <span className="text-[11px] font-semibold text-white">{name}</span>
        </div>
        {muted && (
          <div className="size-5 rounded-md bg-rose-500 flex items-center justify-center shadow">
            <MicOff className="size-3 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
