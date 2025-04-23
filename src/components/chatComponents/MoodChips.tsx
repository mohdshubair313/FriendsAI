// src/components/chatComponents/MoodChips.tsx
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const moods = [
  { label: "Happy", value: "happy", emoji: "😊" },
  { label: "Sad", value: "sad", emoji: "😢" },
  { label: "Funny", value: "funny", emoji: "🤣" },
  { label: "Romantic", value: "romantic", emoji: "💖" },
  { label: "Angry", value: "angry", emoji: "😡" },
  { label: "Motivational", value: "motivational", emoji: "🔥" },
  { label: "Philosophical", value: "philosophical", emoji: "🧠" },
];

export function MoodChips({
  selectedMood,
  setSelectedMood,
}: {
  selectedMood: string;
  setSelectedMood: (val: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap px-4 pt-2">
      {moods.map((mood) => (
        <motion.button
          whileTap={{ scale: 0.95 }}
          key={mood.value}
          onClick={() => setSelectedMood(mood.value)}
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium transition backdrop-blur-sm",
            selectedMood === mood.value
              ? "bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <span>{mood.emoji}</span> {mood.label}
        </motion.button>
      ))}
    </div>
  );
}
