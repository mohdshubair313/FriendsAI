"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useCallback, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import ChatNavbar from "@/components/chatComponents/ChatNavbar";
import ChatInput from "@/components/chatComponents/ChatInput";
import MessageList from "@/components/chatComponents/MessageList";
import EmptyState from "@/components/chatComponents/EmptyState";
import nextDynamic from "next/dynamic";
import type { ChatMessage, SearchResult } from "@/lib/chat/message-ui";
import { MoodChips } from "@/components/chatComponents/MoodChips";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPremiumStatus } from "@/store/slices/premiumSlice";
import { sounds } from "@/lib/sounds";

type ChatMsg = ChatMessage;
const VoiceMode = nextDynamic(() => import("@/components/chatComponents/VoiceMode"), { ssr: false });

/**
 * SSE event types emitted by /api/orchestrate.
 * Mirror of the writer types in route.ts — kept narrow so unhandled events
 * are caught at the switch statement.
 */
type SseEvent =
  | { type: "start"; mode?: "chat" | "image" }
  | { type: "conversation"; id: string }
  | { type: "token"; content: string }
  | { type: "search_start" }
  | { type: "search_done"; content: string; search: SearchResult }
  | { type: "image_progress"; phase: "generating" | "uploading" }
  | { type: "image_done"; url: string; prompt: string }
  | { type: "image_failed"; error: string }
  | { type: "aborted" }
  | { type: "error"; content?: string; code?: string }
  | { type: "done" };

/**
 * Stored Message shape returned by /api/conversations/[id]/messages.
 * Keep parsing tolerant — older rows may lack imageUrl.
 */
type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  imageUrl: string | null;
  createdAt: string;
  search?: SearchResult;
};

/**
 * Custom event fired whenever the conversation list might be stale —
 * the sidebar listens for this and refetches /api/conversations.
 *   - On new conversation mint
 *   - After every assistant reply finishes
 */
function dispatchConversationsInvalidate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("conversations:invalidate"));
}

function ChatPageInner() {
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(true);

  const { status: sessionStatus } = useSession();
  const dispatch = useAppDispatch();
  const selectedMood = useAppSelector((s) => s.chat.selectedMood);
  const selectedPersona = useAppSelector((s) => s.persona.selected);
  const isPremium = useAppSelector((s) => s.premium.isPremium);
  const premiumStatus = useAppSelector((s) => s.premium.status);

  useEffect(() => {
    if (sessionStatus === "authenticated" && premiumStatus === "idle") {
      dispatch(fetchPremiumStatus());
    }
  }, [sessionStatus, premiumStatus, dispatch]);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Source of truth for "which conversation are we viewing?" — the URL.
  // /chat        → fresh new conversation
  // /chat?c=ID  → load and resume conversation ID
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("c");

  // ─── Load history when ?c=ID changes ──────────────────────────────────
  useEffect(() => {
    // The server just minted this conversation; keep the streaming message in place.
    if (conversationIdFromUrl && conversationIdFromUrl === conversationIdRef.current && abortRef.current) return;
    abortRef.current?.abort();
    if (!conversationIdFromUrl) {
      // Switched to a fresh /chat — wipe the slate.
      setMessages([]);
      setHistoryError(null);
      conversationIdRef.current = null;
      return;
    }

    let cancelled = false;
    setIsLoadingHistory(true);
    setHistoryError(null);
    conversationIdRef.current = conversationIdFromUrl;

    fetch(`/api/conversations/${conversationIdFromUrl}/messages`, {
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }
        return r.json() as Promise<{ messages: StoredMessage[] }>;
      })
      .then(({ messages: stored }) => {
        if (cancelled) return;
        const formatted: ChatMsg[] = stored
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            // Inline the image URL into the markdown body so MessageBubble's
            // existing markdown renderer picks it up — same shape that
            // live image generations emit.
            content: m.content,
            image: m.imageUrl ? { url: m.imageUrl, prompt: m.content } : undefined,
            search: m.search,
          }));
        setMessages(formatted);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[chat] history load failed:", err);
        setHistoryError(
          (err as { message?: string })?.message?.includes("404")
            ? "This conversation no longer exists."
            : "Couldn't load this conversation. Try again."
        );
        setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationIdFromUrl]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInput(e.target.value);
  };

  // ─── Submit pipeline ─────────────────────────────────────────────────
  const runChat = useCallback(
    async (userText: string) => {
      if (abortRef.current) return;
      const userMessage: ChatMsg = { id: crypto.randomUUID(), role: "user", content: userText };
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, userMessage, {
        id: assistantId, role: "assistant", content: "", status: "thinking",
      }]);
      const updateAssistant = (patch: Partial<ChatMsg>) => {
        setMessages((prev) => prev.map((message) => message.id === assistantId ? { ...message, ...patch } : message));
      };

      const ac = new AbortController();
      abortRef.current = ac;
      setIsLoading(true);
      let acc = "";
      let tokenFrame = 0;
      let terminal = false;
      const flushTokens = () => {
        cancelAnimationFrame(tokenFrame);
        tokenFrame = 0;
        if (acc) updateAssistant({ content: acc });
      };

      try {
        const res = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages.filter((message) => message.content && !message.image && message.status !== "error" && message.status !== "stopped").slice(-19), userMessage]
              .map(({ role, content }) => ({ role, content })),
            webSearch,
            mood: selectedMood,
            persona: selectedPersona,
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

        readLoop: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const line = frame.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            const payload = line.slice(6).trim();
            if (!payload) continue;

            let evt: SseEvent;
            try {
              evt = JSON.parse(payload) as SseEvent;
            } catch {
              continue;
            }

            switch (evt.type) {
              case "start":
                if (evt.mode === "image") {
                  updateAssistant({ status: "generating", image: { url: null, prompt: userText } });
                }
                break;

              case "conversation":
                conversationIdRef.current = evt.id;
                // Sync the URL so a refresh keeps the user on this convo
                // (and the sidebar's active-state highlight tracks it).
                // Use history.replaceState so we don't trigger a re-render
                // and lose the in-progress message slot.
                if (typeof window !== "undefined") {
                  const newUrl = `/chat?c=${evt.id}`;
                  window.history.replaceState({}, "", newUrl);
                }
                dispatchConversationsInvalidate();
                break;

              case "token":
                acc += evt.content;
                if (!tokenFrame) tokenFrame = requestAnimationFrame(() => {
                  tokenFrame = 0;
                  updateAssistant({ content: acc, status: "writing" });
                });
                break;

              case "search_start":
                updateAssistant({ status: "researching", search: { sources: [], queries: [], pending: true } });
                break;

              case "search_done":
                cancelAnimationFrame(tokenFrame);
                tokenFrame = 0;
                acc = evt.content;
                updateAssistant({ content: acc, search: evt.search, status: "writing" });
                break;

              case "image_progress":
                updateAssistant({ status: evt.phase, image: { url: null, prompt: userText } });
                break;

              case "image_done":
                updateAssistant({ content: evt.prompt, status: "done", image: { url: evt.url, prompt: evt.prompt } });
                break;

              case "image_failed":
                terminal = true;
                updateAssistant({ status: "error", content: evt.error, image: undefined });
                break;

              case "aborted":
                terminal = true;
                flushTokens();
                updateAssistant({ status: "stopped" });
                break readLoop;

              case "error":
                terminal = true;
                flushTokens();
                updateAssistant({ status: "error", content: evt.code === "provider_quota"
                  ? `${acc ? acc + "\n\n" : ""}Gemini's quota or rate limit has been reached. Try again later, or switch Search off to use the chat fallback.`
                  : acc || "The response failed. Please try again." });
                break readLoop;

              case "done":
                flushTokens();
                if (!terminal) updateAssistant({ status: "done" });
                terminal = true;
                // Conversation's updatedAt was just bumped server-side —
                // tell the sidebar so this conversation moves to the top.
                dispatchConversationsInvalidate();
                break readLoop;
            }
          }
        }
        if (!terminal) {
          flushTokens();
          updateAssistant({ status: "error", content: acc || "The connection ended before the response completed. Please try again." });
        }
      } catch (err) {
        flushTokens();
        if ((err as { name?: string })?.name === "AbortError") {
          // User pressed Stop — append a soft "(stopped)" marker to whatever
          // partial response we already streamed.
          updateAssistant({ status: "stopped" });
        } else {
          console.error("[chat] failed:", err);
          updateAssistant({ status: "error", content: acc || "Sorry — something went wrong. Please try again." });
        }
      } finally {
        cancelAnimationFrame(tokenFrame);
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [selectedMood, selectedPersona, messages, webSearch]
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

  // Cleanup on unmount: abort the chat fetch.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────
  let mainContent: React.ReactNode;
  if (isLoadingHistory) {
    mainContent = (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-xs">Loading conversation…</span>
        </div>
      </div>
    );
  } else if (historyError) {
    mainContent = (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-zinc-300 text-sm mb-3">{historyError}</p>
          <a href="/chat" className="text-indigo-400 text-sm hover:underline">
            Start a new conversation
          </a>
        </div>
      </div>
    );
  } else if (messages.length === 0) {
    mainContent = (
      <EmptyState onSelect={handleSuggestionClick} selectedMood={selectedMood ?? undefined} />
    );
  } else {
    mainContent = (
      <MessageList messages={messages} isLoading={isLoading} />
    );
  }

  return (
    <div className="relative h-dvh flex flex-col overflow-hidden">
      <ChatNavbar isPremium={isPremium} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {mainContent}
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
        webSearch={webSearch}
        onWebSearchChange={setWebSearch}
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

/**
 * useSearchParams() must live under a Suspense boundary in App Router.
 * The boundary's fallback is the same loading UI the inner component
 * shows for history loads, so the transition is seamless.
 */
export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-dvh flex items-center justify-center bg-black">
          <Loader2 className="size-6 animate-spin text-indigo-400" />
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
