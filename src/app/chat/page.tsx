"use client";

export const dynamic = "force-dynamic";

import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

import ChatNavbar from "@/components/chatComponents/ChatNavbar";
import ChatInput from "@/components/chatComponents/ChatInput";
import MessageList from "@/components/chatComponents/MessageList";
import EmptyState from "@/components/chatComponents/EmptyState";
import VoiceMode from "@/components/chatComponents/VoiceMode";
import { MoodChips } from "@/components/chatComponents/MoodChips";
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

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export default function ChatPage() {
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [input, setInput] = useState("");

  const { status: sessionStatus } = useSession();
  const dispatch = useAppDispatch();
  const selectedMood = useAppSelector((s) => s.chat.selectedMood);
  const isPremium = useAppSelector((s) => s.premium.isPremium);
  const premiumStatus = useAppSelector((s) => s.premium.status);

  useEffect(() => {
    if (sessionStatus === "authenticated" && premiumStatus === "idle") {
      dispatch(fetchPremiumStatus());
    }
  }, [sessionStatus, premiumStatus, dispatch]);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamMode, setStreamMode] = useState<"fast" | "graph" | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Conversation id is minted server-side on the first turn and reused
  // for the rest of the session so /image and persistence flows can
  // attach to a real document.
  const conversationIdRef = useRef<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // ─── Shared streaming runner ─────────────────────────────────────────
  // Pushes the user message, opens an empty assistant slot, and consumes
  // the SSE stream from /api/orchestrate, appending tokens as they arrive.
  // AbortController is stored on a ref so the Stop button can call .abort().
  const runChat = useCallback(
    async (userText: string) => {
      const userMessage: ChatMsg = { role: "user", content: userText };

      let assistantIdx = -1;
      setMessages((prev) => {
        const next = [...prev, userMessage, { role: "assistant" as const, content: "" }];
        assistantIdx = next.length - 1;
        return next;
      });

      const ac = new AbortController();
      abortRef.current = ac;
      setIsLoading(true);
      setStreamMode(null);

      try {
        const res = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [userMessage],
            // null means "auto-detect on the server" (sentimentNode picks)
            mood: selectedMood,
            conversationId: conversationIdRef.current,
          }),
          signal: ac.signal,
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 200)}`);
        }
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";

        readLoop: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by blank lines.
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const line = frame.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            const payload = line.slice(6).trim();
            if (!payload) continue;

            let evt: { type: string; content?: string; mode?: "fast" | "graph"; id?: string };
            try {
              evt = JSON.parse(payload);
            } catch {
              continue;
            }

            if (evt.type === "start") {
              if (evt.mode) setStreamMode(evt.mode);
            } else if (evt.type === "conversation" && evt.id) {
              conversationIdRef.current = evt.id;
            } else if (evt.type === "token" && evt.content) {
              acc += evt.content;
              setMessages((prev) => {
                const next = [...prev];
                if (assistantIdx >= 0 && next[assistantIdx]?.role === "assistant") {
                  next[assistantIdx] = { ...next[assistantIdx], content: acc };
                }
                return next;
              });
            } else if (evt.type === "aborted") {
              break readLoop;
            } else if (evt.type === "error") {
              console.error("[chat] Stream error:", evt.content);
            }
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // User-initiated stop. Append a soft trailing marker.
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = {
                ...last,
                content: last.content + (last.content ? "\n\n_(stopped)_" : "_(stopped)_"),
              };
            }
            return next;
          });
        } else {
          console.error("[chat] Failed:", err);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant" && !last.content) {
              next[next.length - 1] = {
                ...last,
                content: "Sorry — something went wrong. Please try again.",
              };
            }
            return next;
          });
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [selectedMood]
  );

  const handleSubmitCallback = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      const text = input;
      sounds.playWhoosh();
      setInput("");
      await runChat(text);
    },
    [input, isLoading, runChat]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleSuggestionClick = (prompt: string) => {
    sounds.playClick();
    void runChat(prompt);
  };

  // Cleanup on unmount — don't leave a dangling fetch.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return (
    // h-dvh + overflow-hidden = the chat surface owns the viewport entirely.
    // No outer scroll. Only the message list scrolls inside.
    <div className="relative h-dvh flex flex-col overflow-hidden">
      <ChatNavbar isPremium={isPremium} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState onSelect={handleSuggestionClick} selectedMood={selectedMood ?? undefined} />
        ) : (
          <MessageList messages={messages as any} isLoading={isLoading} mode={streamMode} />
        )}
      </main>

      <MoodChips />

      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmitCallback}
        isLoading={isLoading}
        isPremium={isPremium}
        onVoiceClick={() => { sounds.playClick(); setIsVoiceModeOpen(true); }}
        onStop={handleStop}
        selectedMood={selectedMood ?? undefined}
      />

      <AnimatePresence>
        {isVoiceModeOpen && (
          <VoiceMode
            isOpen={isVoiceModeOpen}
            onClose={() => setIsVoiceModeOpen(false)}
            onSendMessage={(m) => void runChat(m)}
            isProcessing={isLoading}
            lastMessage={messages[messages.length - 1]?.content}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
