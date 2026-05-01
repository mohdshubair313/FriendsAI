"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Bot,
  Copy,
  Check,
  Volume2,
  Square as StopIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import AgentTrace from "./AgentTrace";
import MultimodalPart from "./MultimodalPart";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  annotations?: any[];
}

/**
 * Strip markdown formatting so the SpeechSynthesis voice doesn't read
 * "asterisk asterisk bold" or "hash hash heading" out loud.
 */
function plainTextForTTS(md: string): string {
  return md
    // Code fences (```...```)
    .replace(/```[\s\S]*?```/g, " ")
    // Inline code
    .replace(/`([^`]+)`/g, "$1")
    // Images / links → keep label only
    .replace(/!\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Headings, bold, italic, blockquote, list markers
    .replace(/^[#>\-\*\+]\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Tables → drop pipes
    .replace(/\|/g, " ")
    // Collapse whitespace
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function MessageBubble({ role, content, annotations }: MessageBubbleProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const trace = annotations?.find((a) => a.type === "trace")?.data;
  const intent = annotations?.find((a) => a.type === "intent")?.data;
  const mood = annotations?.find((a) => a.type === "mood")?.data;
  const imageUrl = annotations?.find((a) => a.type === "image")?.data;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ─── Read Aloud (browser SpeechSynthesis) ───────────────────────────
  const toggleSpeak = () => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }
    // Cancel any other speech in progress (only one bubble talks at a time).
    synth.cancel();

    const u = new SpeechSynthesisUtterance(plainTextForTTS(content));
    u.rate = 1;
    u.pitch = 1;
    const voices = synth.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes("Google US English") || v.name.includes("Samantha") || v.lang === "en-US"
    );
    if (preferred) u.voice = preferred;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    utteranceRef.current = u;
    setIsSpeaking(true);
    synth.speak(u);
  };

  // Stop speaking when the bubble unmounts (route change, etc).
  useEffect(() => {
    return () => {
      if (utteranceRef.current && typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group/message flex w-full gap-3 mb-8",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar — only on AI side. User bubble goes flush right with no avatar. */}
      {!isUser && (
        <div className="shrink-0 size-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
          <Bot className="size-4 text-white" />
        </div>
      )}

      <div className={cn("flex flex-col min-w-0", isUser ? "items-end max-w-[80%]" : "items-start max-w-[88%] flex-1")}>
        {/* Eyebrow label */}
        <div className="mb-1.5 px-1">
          <span className="text-[11px] font-medium text-zinc-500">
            {isUser ? "You" : "Friends AI"}
          </span>
          {!isUser && mood && (
            <span className="ml-2 text-[10px] font-medium text-indigo-300/80 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
              {String(mood).toLowerCase()}
            </span>
          )}
        </div>

        {/* Body */}
        {isUser ? (
          // User bubble: solid indigo, rounded, right-aligned.
          <div className="rounded-3xl rounded-tr-lg bg-indigo-600/95 text-white px-5 py-3 text-[14.5px] leading-relaxed shadow-md shadow-indigo-900/30 border border-indigo-400/30 break-words">
            {content}
          </div>
        ) : (
          // AI message: flush with page background, no bubble. Claude-style.
          <div className="text-zinc-100 text-[15px] leading-[1.7] break-words w-full">
            {(trace || intent) && <AgentTrace trace={trace} intent={intent} mood={mood} />}

            <ReactMarkdown
              className="prose prose-invert prose-sm max-w-none break-words prose-p:leading-[1.7] prose-p:my-3 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-code:text-indigo-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-headings:font-semibold prose-headings:tracking-tight prose-li:my-1"
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    <div className="relative rounded-2xl overflow-hidden my-4 border border-white/10 bg-black/50">
                      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">{match[1]}</span>
                      </div>
                      <pre className="p-4 overflow-x-auto text-[12.5px] font-mono leading-relaxed m-0">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-white/10 text-indigo-200 px-1.5 py-0.5 rounded-md text-[12.5px] font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>

            {imageUrl && <MultimodalPart type="image" url={imageUrl} />}
          </div>
        )}

        {/* Action row — only AI messages get Read-Aloud + Copy. User just gets Copy. */}
        {content.length > 0 && (
          <div
            className={cn(
              "mt-2 flex items-center gap-1 opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 transition-opacity duration-200",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {!isUser && (
              <button
                type="button"
                onClick={toggleSpeak}
                title={isSpeaking ? "Stop reading" : "Read aloud"}
                aria-label={isSpeaking ? "Stop reading aloud" : "Read message aloud"}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                  isSpeaking
                    ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    : "text-zinc-500 hover:text-indigo-300 hover:bg-white/5"
                )}
              >
                {isSpeaking ? (
                  <>
                    <StopIcon className="size-3 fill-current" />
                    Stop
                  </>
                ) : (
                  <>
                    <Volume2 className="size-3.5" />
                    Read aloud
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              title={copied ? "Copied" : "Copy message"}
              aria-label="Copy message"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
