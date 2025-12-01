"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { User, Bot, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MessageBubbleProps = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={clsx(
        "flex w-full gap-4 mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar (AI only) */}
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 border border-white/10 shadow-sm">
          <AvatarImage src="/assets/images/ai-avatar.png" />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={clsx("flex flex-col max-w-[85%] lg:max-w-[75%]", isUser ? "items-end" : "items-start")}>
        {/* Name (Optional) */}
        <span className={clsx("text-xs text-muted-foreground mb-1.5 px-1", isUser && "hidden")}>
          Nova
        </span>

        <div
          className={clsx(
            "relative group px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-foreground text-background rounded-tr-sm"
              : "bg-white/5 border border-white/10 text-foreground rounded-tl-sm backdrop-blur-sm"
          )}
        >
          <ReactMarkdown
            className={clsx(
              "prose prose-sm dark:prose-invert max-w-none break-words",
              isUser ? "prose-p:text-background prose-headings:text-background" : "prose-p:text-foreground"
            )}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                return match ? (
                  <div className="relative rounded-md overflow-hidden my-4 border border-white/10 bg-black/50">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                      <span className="text-xs text-muted-foreground font-mono">{match[1]}</span>
                    </div>
                    <div className="p-4 overflow-x-auto">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </div>
                  </div>
                ) : (
                  <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>

          {/* Copy Button (AI only, visible on hover) */}
          {!isUser && (
            <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
