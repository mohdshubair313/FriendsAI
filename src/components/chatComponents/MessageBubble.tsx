"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type MessageBubbleProps = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 18, stiffness: 120 }}
      className={clsx(
        "rounded-2xl p-4 w-fit max-w-[80%] whitespace-pre-wrap backdrop-blur-md border shadow-md",
        isUser
          ? "self-end bg-white/5 border-white/10 text-white ml-auto"
          : "self-start bg-gradient-to-br from-[#1ef1ff30] to-[#f154ff25] border-white/10 text-white",
        "hover:scale-[1.01] transition-all duration-300"
      )}
    >
      <div
        className={clsx(
          "text-xs font-semibold mb-1",
          isUser ? "text-blue-400 text-right" : "text-green-400"
        )}
      >
        {isUser ? "You" : "Friend AI"}
      </div>

      <ReactMarkdown
        className="prose prose-invert prose-sm text-white leading-relaxed"
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </motion.div>
  );
}
