"use client";

import { FormEvent, useRef, useEffect } from "react";
import { SendIcon } from "lucide-react";
import { AnimatePresence,motion } from "framer-motion";
import clsx from "clsx";

type ChatInputProps = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  isLoading?:boolean
};

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  disabled = false,
  isLoading = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        "w-full px-4 md:px-10 py-6 bg-black/30 backdrop-blur-xl",
        "border-t border-white/10",
        "flex justify-center items-end gap-4",
        "transition-all duration-300"
      )}
    >
      <motion.textarea
        ref={textareaRef}
        value={input}
        onChange={handleInputChange}
        placeholder="Send your magic..."
        rows={1}
        disabled={disabled}
        className={clsx(
          "w-full resize-none max-h-40 p-4 rounded-xl bg-white/5",
          "text-white placeholder-white/40 font-medium text-base",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
          "transition-all duration-300 ease-in-out shadow-lg",
          "border border-white/10 backdrop-blur-md",
          "scrollbar-hide"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* SEND BUTTON */}
      <AnimatePresence mode="wait">
  {!isLoading ? (
    <motion.button
      key="send"
      type="submit"
      disabled={disabled || !input.trim()}
      className={clsx(
        "p-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-500",
        "hover:from-purple-500 hover:to-fuchsia-400",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "text-white shadow-lg transition-all duration-300",
        "relative overflow-hidden group"
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.08 }}
    >
      <motion.span
        className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-300"
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      />
      <SendIcon className="relative z-10 w-5 h-5" />
    </motion.button>
  ) : (
    <motion.div
      key="loader"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-sm font-bold text-white animate-shimmer bg-[length:200%_auto] bg-clip-text text-transparent"
    >
      <span className="animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-pink-300">
        Thinking...
      </span>
    </motion.div>
  )}
</AnimatePresence>
    </form>
  );
}
