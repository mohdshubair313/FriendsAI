"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BrainCircuit, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AgentTraceProps {
  trace?: string;
  intent?: string;
  mood?: string;
}

export default function AgentTrace({ trace, intent, mood }: AgentTraceProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!trace && !intent) return null;

  return (
    <div className="mb-3 w-full max-w-[400px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
      >
        <BrainCircuit className="size-3.5 text-indigo-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 transition-colors">
          Agent Reasoning Process
        </span>
        <ChevronDown className={cn("size-3.5 text-zinc-500 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-400 leading-relaxed font-mono">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                <Sparkles className="size-3 text-amber-400" />
                <span className="text-zinc-300 font-bold uppercase tracking-tighter">Chain of Thought</span>
              </div>
              
              <div className="space-y-2">
                {intent && (
                  <div>
                    <span className="text-indigo-400 font-bold">Intent:</span> {intent}
                  </div>
                )}
                {mood && (
                  <div>
                    <span className="text-purple-400 font-bold">Mood:</span> {mood}
                  </div>
                )}
                {trace && (
                  <div className="text-zinc-500 whitespace-pre-wrap italic">
                    &quot;{trace}&quot;
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
