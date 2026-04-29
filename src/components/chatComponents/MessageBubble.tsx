"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { 
  Bot, 
  Copy, 
  Check, 
  Play, 
  Share2, 
  MoreHorizontal,
  Sparkles,
  Volume2
} from "lucide-react";
import { useState } from "react";
import AgentTrace from "./AgentTrace";
import MultimodalPart from "./MultimodalPart";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  annotations?: any[]; // For Agent Traces & Multimodal Parts
  isPremium?: boolean;
}

export default function MessageBubble({ role, content, annotations, isPremium }: MessageBubbleProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const trace = annotations?.find(a => a.type === "trace")?.data;
  const intent = annotations?.find(a => a.type === "intent")?.data;
  const mood = annotations?.find(a => a.type === "mood")?.data;
  const imageUrl = annotations?.find(a => a.type === "image")?.data;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex w-full gap-4 mb-6 group/message",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <div className={cn(
          "size-10 rounded-2xl flex items-center justify-center shadow-2xl relative transition-transform group-hover/message:scale-110",
          isUser 
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20" 
            : "bg-gradient-to-br from-indigo-600 to-purple-700 shadow-indigo-500/30"
        )}>
          {isUser ? (
            <span className="text-xs font-bold text-white">YOU</span>
          ) : (
            <Bot className="size-5 text-white" />
          )}
          
          {!isUser && isPremium && (
            <div className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-500 flex items-center justify-center border-2 border-black shadow-lg">
              <Sparkles className="size-2 text-white fill-white" />
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className={cn(
        "flex flex-col max-w-[80%] lg:max-w-[70%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Name/Label */}
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {isUser ? "You" : "Spherial AI"}
          </span>
          {!isUser && mood && (
            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {mood.toUpperCase()}
            </span>
          )}
        </div>

        {/* Message Bubble */}
        <div className={cn(
          "relative p-5 rounded-3xl text-sm leading-relaxed shadow-lg",
          isUser 
            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-md border border-white/20"
            : "bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 text-zinc-100 rounded-tl-md border border-white/10"
        )}>
          {/* Subtle inner glow */}
          <div className={cn(
            "absolute inset-0 rounded-3xl opacity-20 pointer-events-none",
            isUser 
              ? "bg-gradient-to-t from-white/10 to-transparent" 
              : "bg-gradient-to-t from-white/5 to-transparent"
          )} />

          {/* Agent Trace (Phase 2) */}
          {!isUser && (trace || intent) && (
            <AgentTrace trace={trace} intent={intent} mood={mood} />
          )}

          <div className="relative">
            <ReactMarkdown
              className="prose prose-invert prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-code:text-indigo-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline"
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    <div className="relative rounded-xl overflow-hidden my-4 border border-white/10 bg-black/40">
                      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">{match[1]}</span>
                        <button className="text-zinc-400 hover:text-white transition-colors">
                          <Copy className="size-3" />
                        </button>
                      </div>
                      <div className="p-4 overflow-x-auto text-xs font-mono">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <code className="bg-white/10 text-indigo-200 px-1.5 py-0.5 rounded text-[11px] font-mono border border-white/10" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Multimodal Part (Phase 2) */}
          {imageUrl && (
            <MultimodalPart type="image" url={imageUrl} />
          )}

          {/* Actions Bar */}
          <div className={cn(
            "flex items-center gap-3 mt-4 pt-4 border-t border-white/10 opacity-0 group-hover/message:opacity-100 transition-opacity duration-300",
            isUser ? "justify-end" : "justify-start"
          )}>
            {!isUser && (
              <>
                <button 
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-indigo-400 transition-all text-[10px] font-bold"
                  title="Stream TTS"
                >
                  <Volume2 className="size-3.5" />
                  READ ALOUD
                </button>
                <div className="w-px h-3 bg-white/20" />
              </>
            )}
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-[10px] font-bold"
            >
              {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
              {copied ? "COPIED" : "COPY"}
            </button>
            <button className="text-zinc-400 hover:text-white transition-all p-1">
              <Share2 className="size-3.5" />
            </button>
            <button className="text-zinc-400 hover:text-white transition-all p-1">
              <MoreHorizontal className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
