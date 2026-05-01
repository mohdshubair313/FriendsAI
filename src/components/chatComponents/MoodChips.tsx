"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMood, clearMood } from "@/store/slices/chatSlice";
import { MOODS } from "@/app/chat/page";

/**
 * Mood selector chips. The leading "Auto" chip clears the user's pick
 * and lets the sentiment node decide. The remaining 8 chips override
 * detection until cleared.
 */
export function MoodChips() {
  const dispatch = useAppDispatch();
  const selectedMood = useAppSelector((s) => s.chat.selectedMood);

  return (
    <div className="flex gap-2 flex-wrap items-center justify-center px-4 py-2">
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        type="button"
        onClick={() => dispatch(clearMood())}
        title="Let the AI adapt its tone to your mood"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
          selectedMood === null
            ? "bg-indigo-500 text-white border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.45)]"
            : "bg-stone-800/60 text-stone-400 border-stone-700/50 hover:border-indigo-500/40 hover:text-stone-200"
        }`}
      >
        <Sparkles className="size-3" />
        Auto
      </motion.button>

      <span className="h-4 w-px bg-stone-700/60 mx-1" aria-hidden />

      {MOODS.map((mood) => (
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          key={mood.id}
          type="button"
          onClick={() => dispatch(setMood(mood.id))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
            selectedMood === mood.id
              ? "bg-amber-500 text-stone-950 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              : "bg-stone-800/60 text-stone-400 border-stone-700/50 hover:border-amber-500/40 hover:text-stone-200"
          }`}
        >
          <span>{mood.emoji}</span>
          {mood.label}
        </motion.button>
      ))}
    </div>
  );
}
