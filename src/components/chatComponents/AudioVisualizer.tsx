"use client";

import { motion } from "framer-motion";

interface AudioVisualizerProps {
  level: number;
  isSpeaking: boolean;
  color?: string;
}

export default function AudioVisualizer({ level, isSpeaking, color = "bg-indigo-500" }: AudioVisualizerProps) {
  // Normalize level to a reasonable number of bars
  const bars = Array.from({ length: 24 });
  
  return (
    <div className="flex items-center justify-center gap-1 h-12 px-4">
      {bars.map((_, i) => {
        // Create a symmetric waveform effect
        const distanceToCenter = Math.abs(i - 11.5);
        const factor = Math.max(0.2, 1 - distanceToCenter / 12);
        const height = isSpeaking ? (level * factor * 1.5) : 4;
        
        return (
          <motion.div
            key={i}
            animate={{ 
              height: Math.max(4, height),
              backgroundColor: isSpeaking ? "rgba(99, 102, 241, 1)" : "rgba(63, 63, 70, 1)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "w-1 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]",
              color
            )}
          />
        );
      })}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
