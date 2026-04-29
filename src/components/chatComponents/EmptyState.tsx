"use client";

import { motion } from "framer-motion";
import { 
  Sparkles, 
  Heart, 
  Smile, 
  Zap, 
  BookOpen, 
  Coffee, 
  Cpu, 
  BrainCircuit,
  MessageSquarePlus,
  Compass
} from "lucide-react";
import { MOODS } from "@/app/chat/page";
import { cn } from "@/lib/utils";

const moodSuggestions: Record<string, { icon: React.ReactNode; label: string; prompt: string }[]> = {
  friendly: [
    { icon: <Coffee className="size-4" />, label: "Productive Morning", prompt: "I need a high-impact morning routine for a software engineer." },
    { icon: <Compass className="size-4" />, label: "Explore Trends", prompt: "What are the top 3 AI trends disrupting the industry right now?" },
  ],
  happy: [
    { icon: <Sparkles className="size-4" />, label: "Visualize Success", prompt: "Help me script a 5-minute visualization for a major product launch." },
    { icon: <Zap className="size-4" />, label: "Energy Boost", prompt: "What are some high-frequency habits to maintain peak performance?" },
  ],
  philosophical: [
    { icon: <BrainCircuit className="size-4" />, label: "Neural Ethics", prompt: "Let's debate the ethical implications of AGI on human creativity." },
    { icon: <BookOpen className="size-4" />, label: "Existential Risk", prompt: "What is the most compelling argument for the simulation hypothesis?" },
  ],
};

const defaultSuggestions = moodSuggestions.friendly;

interface EmptyStateProps {
  onSelect: (prompt: string) => void;
  selectedMood?: string;
}

export default function EmptyState({ onSelect, selectedMood = "friendly" }: EmptyStateProps) {
  const activeMood = MOODS.find((m) => m.id === selectedMood);
  const suggestions = moodSuggestions[selectedMood] ?? defaultSuggestions;

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-12"
      >
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] -z-10 rounded-full" />
        
        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-white/[0.03] border border-white/10 mb-6 glass shadow-2xl relative group overflow-hidden transition-transform hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Cpu className="size-10 text-indigo-400 group-hover:text-white transition-colors relative z-10" />
        </div>

        <h2 className="text-4xl font-black tracking-tight text-white mb-3 uppercase italic">
          {activeMood ? `${activeMood.label} Core Active` : "Neural Interface Online"}
        </h2>
        <p className="text-zinc-500 text-sm max-w-md mx-auto font-medium leading-relaxed">
          Spherial Intelligence has initialized in <span className="text-indigo-400 font-bold">{activeMood?.label}</span> mode. 
          Ready to orchestrate your next breakthrough.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {suggestions.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
            onClick={() => onSelect(item.prompt)}
            className="group relative flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.06] transition-all text-left glass shadow-xl active:scale-[0.98]"
          >
            <div className="p-3 rounded-xl bg-white/5 text-zinc-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all shrink-0">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-xs text-zinc-300 mb-1 flex items-center justify-between">
                {item.label}
                <MessageSquarePlus className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
              </div>
              <div className="text-[11px] text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-400 transition-colors">
                {item.prompt}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Feature Badges */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex items-center gap-6"
      >
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Model: Gemini 1.5 Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-indigo-500" />
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Logic: LangGraph</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-purple-500" />
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Visuals: Flux Pro</span>
        </div>
      </motion.div>
    </div>
  );
}
