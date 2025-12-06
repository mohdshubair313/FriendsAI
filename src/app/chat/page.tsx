"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import ChatNavbar from "@/components/chatComponents/ChatNavbar";
import ChatInput from "@/components/chatComponents/ChatInput";
import MessageBubble from "@/components/chatComponents/MessageBubble";
import EmptyState from "@/components/chatComponents/EmptyState";
import VoiceMode from "@/components/chatComponents/VoiceMode";


export default function ChatPage() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const { data: session, status } = useSession();
  const [anonymousCount, setAnonymousCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      const count = localStorage.getItem("anonymousMessageCount");
      setAnonymousCount(count ? parseInt(count) : 0);
    }
  }, [status]);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const res = await fetch("/api/check-subscription");
        const data = await res.json();
        if (data.isPremium) {
          setIsPremium(true);
          toast.success("🎉 Premium features enabled!");
        }
      } catch (err) {
        console.error("Failed to check subscription:", err);
      }
    };

    checkPremiumStatus();
  }, []);

  const { messages, input, handleInputChange, handleSubmit: baseHandleSubmit, isLoading, append, setInput } = useChat({
    api: "/api/generate",
    body: {
      mood: "friendly",
      userId: session?.user?.id,
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
    },
    onFinish: (message) => {
      console.log("Message finished:", message);
    },
  });

  const checkAnonymousLimit = useCallback(() => {
    if (status === "unauthenticated") {
      if (anonymousCount >= 2) {
        toast.error("Login required to continue chatting!");
        return false;
      }
      const newCount = anonymousCount + 1;
      setAnonymousCount(newCount);
      localStorage.setItem("anonymousMessageCount", newCount.toString());
    }
    return true;
  }, [anonymousCount, status]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!checkAnonymousLimit()) return;
      if (!input.trim()) {
        toast.error("Please enter a message");
        return;
      }
      baseHandleSubmit(e);
    },
    [checkAnonymousLimit, input, baseHandleSubmit],
  );

  const handleVoiceMessage = useCallback(
    (message: string) => {
      if (!checkAnonymousLimit()) return;
      if (!message.trim()) {
        toast.error("No message detected. Please try again.");
        return;
      }
      append({ role: "user", content: message });
    },
    [checkAnonymousLimit, append],
  );

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    // Optional: Auto-submit or just fill input
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <ChatNavbar />

      <main className="flex-1 relative z-10 flex flex-col max-w-4xl mx-auto w-full h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <EmptyState onSelect={handleSuggestionClick} />
          ) : (
            <div className="space-y-6 pb-4">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  if (m.role === "data" && "type" in m && m.type === "image") {
                    return (
                      <motion.div
                        key={m.id || `image-${i}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex justify-start mb-6"
                      >
                        <div className="rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-white/5 p-2 max-w-sm">
                          {"base64" in m ? (
                            <Image
                              src={m.base64 as string}
                              alt="Generated AI"
                              width={512}
                              height={512}
                              className="w-full h-auto object-cover rounded-xl"
                              unoptimized
                            />
                          ) : (
                            <p className="text-center text-muted-foreground p-4">
                              Image generation failed
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Generated by Nova 🔮
                          </p>
                        </div>
                      </motion.div>
                    );
                  }

                  if (["user", "assistant", "system"].includes(m.role)) {
                    return (
                      <MessageBubble
                        key={m.id}
                        role={m.role as "user" | "assistant" | "system"}
                        content={m.content}
                      />
                    );
                  }
                  return null;
                })}
              </AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start ml-12"
                >
                  <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="relative z-20">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            isPremium={isPremium}
            onVoiceClick={() => setIsVoiceModeOpen(true)}
          />
        </div>
      </main>

      <VoiceMode
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onSendMessage={handleVoiceMessage}
        isProcessing={isLoading}
        lastMessage={
          messages[messages.length - 1]?.role === "assistant"
            ? messages[messages.length - 1].content
            : undefined
        }
      />
    </div>
  );
}
