"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shape returned by GET /api/conversations.
 */
export interface ConversationListItem {
  id: string;
  title: string;
  pinned: boolean;
  preview: string | null;
  lastMessageRole: "user" | "assistant" | "tool" | "system" | null;
  createdAt: string;
  updatedAt: string;
}

interface State {
  conversations: ConversationListItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Conversation list hook.
 *
 * Fetches /api/conversations on mount and exposes a `refetch` callback so
 * other parts of the app (chat page after a new mint, profile page after
 * delete, etc) can poke the sidebar.
 *
 * Cross-component invalidation: any code that mutates conversations can
 * dispatch a `CustomEvent("conversations:invalidate")` on `window` and
 * every mounted sidebar will refetch automatically. This keeps the
 * sidebar in sync without needing global Redux for what is otherwise
 * a very localized concern.
 */
export function useConversations(): State & { refetch: () => Promise<void> } {
  const [state, setState] = useState<State>({
    conversations: [],
    loading: true,
    error: null,
  });

  // Always-current ref to the latest fetch's AbortController so a fast
  // sequence of invalidates doesn't race (newer wins, older is aborted).
  const inFlightRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    // Abort any in-flight request so the newer one is the only writer.
    inFlightRef.current?.abort();
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/conversations", {
        cache: "no-store",
        signal: ctrl.signal,
      });
      if (!res.ok) {
        if (res.status === 401) {
          // Logged-out — no conversations to show, no error toast.
          setState({ conversations: [], loading: false, error: null });
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as { conversations: ConversationListItem[] };
      if (ctrl.signal.aborted) return;
      setState({ conversations: json.conversations, loading: false, error: null });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      console.error("[useConversations] failed:", err);
      setState({
        conversations: [],
        loading: false,
        error: (err as { message?: string })?.message ?? "Failed to load",
      });
    }
  }, []);

  useEffect(() => {
    void refetch();
    const onInvalidate = () => void refetch();
    window.addEventListener("conversations:invalidate", onInvalidate);
    return () => {
      window.removeEventListener("conversations:invalidate", onInvalidate);
      inFlightRef.current?.abort();
    };
  }, [refetch]);

  return { ...state, refetch };
}
