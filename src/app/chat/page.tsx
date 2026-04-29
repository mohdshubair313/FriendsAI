"use client";

export const dynamic = "force-dynamic";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

import ChatNavbar from "@/components/chatComponents/ChatNavbar";
import ChatInput from "@/components/chatComponents/ChatInput";
import MessageList from "@/components/chatComponents/MessageList";
import EmptyState from "@/components/chatComponents/EmptyState";
import VoiceMode from "@/components/chatComponents/VoiceMode";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPremiumStatus } from "@/store/slices/premiumSlice";
import { sounds } from "@/lib/sounds";

export const MOODS = [
  { id: "friendly",      label: "Friendly",       emoji: "😊" },
  { id: "happy",         label: "Happy",           emoji: "😄" },
  { id: "sad",           label: "Sad",             emoji: "😢" },
  { id: "funny",         label: "Funny",           emoji: "😂" },
  { id: "motivational",  label: "Motivational",    emoji: "💪" },
  { id: "romantic",      label: "Romantic",        emoji: "💝" },
  { id: "philosophical", label: "Philosophical",   emoji: "🧠" },
  { id: "angry",         label: "Calm me down",    emoji: "😤" },
];

export default function ChatPage() {
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [input, setInput] = useState("");

  const { data: session, status: sessionStatus } = useSession();
  const dispatch = useAppDispatch();
  const selectedMood = useAppSelector((s) => s.chat.selectedMood);
  const isPremium = useAppSelector((s) => s.premium.isPremium);
  const premiumStatus = useAppSelector((s) => s.premium.status);

  useEffect(() => {
    if (sessionStatus === "authenticated" && premiumStatus === "idle") {
      dispatch(fetchPremiumStatus());
    }
  }, [sessionStatus, premiumStatus, dispatch]);

  // Use direct fetch instead of useChat to avoid streaming issues
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmitCallback = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      
      const userMessage = { role: "user", content: input };
      const currentInput = input;
      
      // Add user message immediately to show in UI
      setMessages(prev => [...prev, userMessage]);
      
      sounds.playWhoosh();
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [userMessage],  // Just send the new message
            mood: selectedMood,
          }),
        });

        const data = await res.json();
        console.log("Chat response:", data);
        
        if (data.error) {
          console.error("Chat error:", data.error);
          setIsLoading(false);
          return;
        }

        // Handle the response format from our API
        if (data.messages?.[0]?.content) {
          const aiMessage = { role: "assistant", content: data.messages[0].content };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          console.error("No response content:", data);
        }
      } catch (err) {
        console.error("Failed to send:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, selectedMood]
  );

  const handleSuggestionClick = (prompt: string) => {
    sounds.playClick();
    // Trigger submit with the prompt
    const userMessage = { role: "user", content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    fetch("/api/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        mood: selectedMood,
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.messages?.[0]?.content) {
        setMessages(prev => [...prev, { role: "assistant", content: data.messages[0].content }]);
      }
    })
    .finally(() => setIsLoading(false));
  };

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <ChatNavbar isPremium={isPremium} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-12">
        {messages.length === 0 ? (
          <EmptyState onSelect={handleSuggestionClick} selectedMood={selectedMood} />
        ) : (
          <MessageList messages={messages as any} isLoading={isLoading} />
        )}
      </main>

<ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmitCallback}
        isLoading={isLoading}
        isPremium={isPremium}
        onVoiceClick={() => { sounds.playClick(); setIsVoiceModeOpen(true); }}
        selectedMood={selectedMood}
      />

      <AnimatePresence>
        {isVoiceModeOpen && (
          <VoiceMode
            isOpen={isVoiceModeOpen}
            onClose={() => setIsVoiceModeOpen(false)}
            onSendMessage={(m) => {
              setMessages(prev => [...prev, { role: "user", content: m }]);
              // Send the message via API
              setIsLoading(true);
              fetch("/api/orchestrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [...messages, { role: "user", content: m }],
                  mood: selectedMood,
                }),
              })
              .then(res => res.json())
              .then(data => {
                if (data.messages?.[0]?.content) {
                  setMessages(prev => [...prev, { role: "assistant", content: data.messages[0].content }]);
                }
              })
              .finally(() => setIsLoading(false));
            }}
            isProcessing={isLoading}
            lastMessage={(messages[messages.length - 1] as any)?.content}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
