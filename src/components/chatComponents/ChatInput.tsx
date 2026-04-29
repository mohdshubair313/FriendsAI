"use client";

import { FormEvent, useRef, useEffect, useState, useCallback } from "react";
import { 
  Mic, 
  ArrowUp, 
  Square, 
  Image as ImageIcon, 
  Paperclip, 
  Sparkles,
  Zap,
  Globe,
  Settings2,
  X,
  FileIcon,
  CloudUpload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOODS } from "@/app/chat/page";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>, attachments?: File[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  isPremium?: boolean;
  onVoiceClick?: () => void;
  selectedMood?: string;
};

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  disabled = false,
  isLoading = false,
  isPremium = false,
  onVoiceClick,
  selectedMood = "friendly",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isImageGenMode, setIsImageGenMode] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [charCount, setCharCount] = useState(0);

  const MAX_CHARS = 4000;
  const WARN_CHARS = 3800;

  useEffect(() => {
    setCharCount(input.length);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || attachments.length > 0) && !disabled && !isLoading) {
        handleSubmit(e as unknown as FormEvent<HTMLFormElement>, attachments);
        setAttachments([]);
        setPreviews([]);
      }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "application/pdf"];
    
    const validFiles = files.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        console.warn(`[ChatInput] Rejected file: ${file.name} - unsupported type`);
        return false;
      }
      if (file.size > MAX_SIZE) {
        console.warn(`[ChatInput] Rejected file: ${file.name} - exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const activeMood = MOODS.find((m) => m.id === selectedMood);

  // Detect if user is typing an image prompt
  useEffect(() => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.startsWith("/image") || lowerInput.includes("generate image") || lowerInput.includes("draw")) {
      setIsImageGenMode(true);
    } else {
      setIsImageGenMode(false);
    }
  }, [input]);

  return (
    <div className="w-full max-w-4xl mx-auto px-6 pb-8 relative z-20">
      <motion.div
        layoutId="omni-input"
        className={cn(
          "relative glass rounded-[2.5rem] transition-all duration-500 overflow-hidden",
          isFocused ? "shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] border-indigo-500/30" : "border-white/5",
          isImageGenMode && "shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)] border-purple-500/40"
        )}
      >
        {/* Dynamic Glow Accents */}
        <div className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-700 pointer-events-none",
          isFocused && "opacity-100 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.08)_0%,transparent_70%)]",
          isImageGenMode && "opacity-100 bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.12)_0%,transparent_70%)]"
        )} />
        
        {isImageGenMode && (
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          />
        )}

        <div className="relative p-2">
          {/* Attachment Previews */}
          <AnimatePresence>
            {previews.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap gap-3 px-4 py-3 border-b border-white/5 mb-2 overflow-hidden"
              >
                {previews.map((src, i) => (
                  <motion.div 
                    key={src}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative size-16 rounded-xl overflow-hidden group border border-white/10"
                  >
                    <img src={src} alt="preview" className="size-full object-cover" />
                    <button 
                      onClick={() => removeAttachment(i)}
                      className="absolute top-1 right-1 size-5 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Bar: Capabilities & Context */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 mb-2">
            <div className="flex items-center gap-3">
              <motion.div 
                layout
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all duration-500",
                  isImageGenMode ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                )}
              >
                {isImageGenMode ? <Sparkles className="size-3 animate-pulse" /> : <Zap className="size-3" />}
                {isImageGenMode ? "Image Synthesis Active" : "Multimodal Orchestration"}
              </motion.div>
              <div className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-zinc-700" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{activeMood?.label} Mode</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                <Globe className="size-3 text-zinc-400" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Web Search: On</span>
              </div>
              <button type="button" className="p-1 text-zinc-600 hover:text-white transition-colors">
                <Settings2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Main Input Area */}
          <form 
            onSubmit={(e) => {
              handleSubmit(e, attachments);
              setAttachments([]);
              setPreviews([]);
            }} 
            className="flex flex-col"
          >
            <div className="flex items-end gap-3 px-3 py-2">
              {/* Attachment Button */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                multiple 
                className="hidden" 
                accept=".png,.jpg,.jpeg,.webp,.gif,.pdf"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mb-1 p-2.5 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all relative group"
                title="Upload multimodal assets"
              >
                <Paperclip className="size-5" />
                <AnimatePresence>
                  {attachments.length > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 size-4 rounded-full bg-indigo-500 text-[8px] font-black flex items-center justify-center text-white border-2 border-black"
                    >
                      {attachments.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isImageGenMode ? "Describe the vision you want to generate..." : "Ask Spherial anything multimodal..."}
                rows={1}
                maxLength={MAX_CHARS}
                disabled={disabled}
                className="flex-1 max-h-[200px] py-2.5 bg-transparent text-white placeholder:text-zinc-500 text-[15px] font-medium focus:outline-none resize-none min-h-[48px]"
              />

              {/* Character Count Indicator */}
              {(charCount > WARN_CHARS || attachments.length > 0) && (
                <div className={cn(
                  "absolute bottom-14 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full z-10",
                  charCount > MAX_CHARS 
                    ? "bg-red-500/20 text-red-400" 
                    : charCount > WARN_CHARS 
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-zinc-700/50 text-zinc-300"
                )}>
                  {charCount}/{MAX_CHARS}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 mb-1.5 shrink-0">
                <AnimatePresence mode="popLayout">
                  {!input.trim() && attachments.length === 0 && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      type="button"
                      onClick={() => {
                        setIsImageGenMode(!isImageGenMode);
                        if (!isImageGenMode) handleInputChange({ target: { value: "/image " } } as any);
                      }}
                      className={cn(
                        "p-2.5 rounded-2xl transition-all border shadow-lg",
                        isImageGenMode 
                          ? "bg-purple-600 border-purple-400 text-white shadow-purple-500/30" 
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                      )}
                      title="Image Studio"
                    >
                      <ImageIcon className="size-5" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {isPremium && !isLoading && onVoiceClick && (
                  <button
                    type="button"
                    onClick={onVoiceClick}
                    className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all shadow-lg active:scale-95"
                    title="Live Audio Link"
                  >
                    <Mic className="size-5" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={disabled || (!input.trim() && attachments.length === 0 && !isLoading)}
                  className={cn(
                    "p-2.5 rounded-2xl transition-all duration-300 shadow-2xl",
                    isLoading
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : (input.trim() || attachments.length > 0)
                      ? isImageGenMode ? "bg-purple-600 text-white border-purple-400 shadow-purple-500/40 scale-105" : "bg-indigo-600 text-white border border-indigo-400 shadow-indigo-500/40 scale-105"
                      : "bg-zinc-900 text-zinc-700 border border-white/5 cursor-not-allowed"
                  )}
                >
                  {isLoading ? <Square className="size-5 fill-current" /> : <ArrowUp className="size-5 stroke-[3]" />}
                </button>
              </div>
            </div>
            
            {/* Contextual Suggestions */}
            <div className="flex items-center gap-3 px-4 pb-2.5">
              <SuggestionChip label="/image" onClick={() => handleInputChange({ target: { value: "/image " } } as any)} />
              <SuggestionChip label="/reason" onClick={() => handleInputChange({ target: { value: "/reason " } } as any)} />
              <SuggestionChip label="Analyze PDF" icon={FileIcon} />
              
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Neural v2.4 Status:</span>
                <div className="size-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function SuggestionChip({ label, icon: Icon, onClick }: any) {
  return (
    <button 
      type="button" 
      onClick={onClick}
      className="flex items-center gap-1.5 text-[9px] font-black text-zinc-600 hover:text-indigo-400 transition-all uppercase tracking-widest group"
    >
      {Icon && <Icon className="size-3 group-hover:scale-110 transition-transform" />}
      {label}
    </button>
  );
}
