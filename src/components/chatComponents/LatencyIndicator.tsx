"use client";

import { useEffect, useState } from "react";
import { Activity, Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LatencyIndicatorProps {
  latency?: number;
  jitter?: number;
}

export default function LatencyIndicator({ latency = 24, jitter = 2 }: LatencyIndicatorProps) {

  const getStatusColor = () => {
    if (latency < 30) return "text-green-500";
    if (latency < 45) return "text-amber-500";
    return "text-red-500";
  };

  const getSignalIcon = () => {
    if (latency < 30) return <SignalHigh className="size-3" />;
    if (latency < 45) return <SignalMedium className="size-3" />;
    return <SignalLow className="size-3" />;
  };

  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Network Health</span>
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn("size-1.5 rounded-full", latency < 45 ? "bg-green-500" : "bg-amber-500")}
          />
          <span className="text-xs font-bold text-white uppercase tracking-tighter flex items-center gap-1.5">
            Optimal {getSignalIcon()}
          </span>
        </div>
      </div>

      <div className="w-px h-6 bg-white/10" />

      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Latency / Jitter</span>
        <div className="flex items-center gap-2">
          <Activity className={cn("size-3", getStatusColor())} />
          <span className={cn("text-xs font-bold tracking-tighter", getStatusColor())}>
            {latency}ms <span className="text-zinc-600 opacity-60">±{jitter}ms</span>
          </span>
        </div>
      </div>
    </div>
  );
}
