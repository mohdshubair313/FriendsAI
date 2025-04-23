"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type MessageListProps = {
  messages: Message[];
};

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // scroll to latest message on update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 w-full overflow-y-auto px-4 py-6 md:px-10 scrollbar-hide">
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
