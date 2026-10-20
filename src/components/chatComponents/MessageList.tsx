"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import type { ChatMessage } from "@/lib/chat/message-ui";

export default function MessageList({ messages, isLoading }: {
  messages: ChatMessage[]; isLoading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      if (followRef.current) element.scrollTop = element.scrollHeight;
    });
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = scrollRef.current;
    // Avoid restarting a smooth scroll for every streamed token.
    if (element && followRef.current) element.scrollTop = element.scrollHeight;
  }, [messages, isLoading]);
  return (
    <div ref={scrollRef} onScroll={(event) => {
      const el = event.currentTarget;
      followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }} className="flex-1 w-full overflow-y-auto px-4 pt-4 pb-2 md:px-12 no-scrollbar">
      <div className="flex flex-col max-w-3xl mx-auto min-h-full">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => <MessageBubble key={message.id ?? index} {...message} />)}
        </AnimatePresence>
        <div className="h-8 shrink-0" />
      </div>
    </div>
  );
}
