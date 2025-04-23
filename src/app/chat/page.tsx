'use client';

import { useChat } from '@ai-sdk/react'
import { useEffect, useRef, useState } from 'react';
// import { Message } from '@/lib/types';
import { motion } from 'framer-motion';

import ChatNavbar from '@/components/chatComponents/ChatNavbar';
import ChatInput from '@/components/chatComponents/ChatInput';
import MessageBubble from '@/components/chatComponents/MessageBubble';
import { SparklesText } from '@/components/magicui/sparkles-text'; 
import { MoodChips } from '@/components/chatComponents/MoodChips';

export default function ChatPage() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [mood, setMood] = useState('happy');

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useChat({
    api: '/api/chat',
    body: {mood}
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <SparklesText
          // fontSize={32}
          // color="white"
          className="text-center text-4xl font-bold opacity-20"
        >
          Let&lsquo;s Chat!
        </SparklesText>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col h-screen">
        <ChatNavbar />

        {/* 💡 Mood Selector */}
        <div className="px-4 pt-2 pb-1">
          <p className="text-sm text-white/70 mb-1">🎭 Set your mood</p>
          <MoodChips selectedMood={mood} setSelectedMood={setMood} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4">
          {messages.filter(m => m.role !== "data").map((m, i) => 
            (m.role == 'user'|| m.role == 'assistant' || m.role == 'system') ? (
              <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              {/* ✅ Pass individual props, not wrapped object */}
              <MessageBubble role={m.role} content={m.content} />
            </motion.div>
            ):null
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-lg border-t border-white/10">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading} // ✅ Prop exists in type
          />
        </div>
      </div>
    </div>
  );
}
