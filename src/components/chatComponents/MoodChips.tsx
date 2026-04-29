"use client";

import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMood } from "@/store/slices/chatSlice";
import { MOODS } from "@/app/chat/page";

export function MoodChips() {
  const dispatch = useAppDispatch();
  const selectedMood = useAppSelector((s) => s.chat.selectedMood);

  return (
    <div className="flex gap-2 flex-wrap px-4 py-2">
      {MOODS.map((mood) => (
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          key={mood.id}
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
