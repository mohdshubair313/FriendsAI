"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UsageMeterProps {
  label: string;
  used: number;
  total: number;
  unit: string;
  color?: string;
}

export default function UsageMeter({ label, used, total, unit, color = "bg-indigo-500" }: UsageMeterProps) {
  const percentage = Math.min(100, (used / total) * 100);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-[10px] font-bold text-zinc-300">
          {used} / {total} {unit}
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]", color)}
        />
      </div>
    </div>
  );
}
