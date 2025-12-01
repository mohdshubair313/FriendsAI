"use client";

import { FormEvent, useRef, useEffect, useState } from "react";
import { SendIcon, Paperclip, Mic, ArrowUp, Square } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ChatInputProps = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  isLoading?: boolean;
  isPremium?: boolean;
  onVoiceClick?: () => void;
};

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  disabled = false,
  isLoading = false,
  isPremium = false,
  onVoiceClick,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !disabled && !isLoading) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={clsx(
          "relative flex flex-col w-full p-3 rounded-3xl transition-all duration-300",
          "bg-white/5 dark:bg-black/40 backdrop-blur-xl",
          "border border-white/10 shadow-2xl",
          isFocused ? "ring-2 ring-primary/20 border-primary/30" : "hover:border-white/20"
        )}
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2"
        >
          {/* Attachment Button (Placeholder) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full h-10 w-10 shrink-0 mb-0.5"
                  onClick={() => toast.info("Attachments coming soon!")}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Send a message..."
            rows={1}
            disabled={disabled}
            className={clsx(
              "flex-1 max-h-[200px] py-3 px-2 bg-transparent",
              "text-foreground placeholder:text-muted-foreground/50 text-base",
              "focus:outline-none resize-none scrollbar-hide",
              "min-h-[44px]"
            )}
          />

          <div className="flex items-center gap-2 mb-0.5 shrink-0">
            {/* Voice Mode Button */}
            {isPremium && !isLoading && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onVoiceClick}
                      className="text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full h-10 w-10"
                    >
                      <Mic className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voice Mode</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Send / Stop Button */}
            <Button
              type="submit"
              disabled={disabled || (!input.trim() && !isLoading)}
              size="icon"
              className={clsx(
                "h-10 w-10 rounded-full transition-all duration-300 shadow-lg",
                isLoading
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                  : input.trim()
                    ? "bg-foreground text-background hover:opacity-90"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {isLoading ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Footer Hint */}
      <div className="text-center mt-3">
        <p className="text-xs text-muted-foreground/60">
          Nova Chat can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
