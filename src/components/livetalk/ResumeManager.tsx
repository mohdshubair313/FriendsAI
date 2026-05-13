"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLocale } from "@/store/slices/localeSlice";
import { setPersona } from "@/store/slices/personaSlice";
import { setVoiceStyle } from "@/store/slices/voiceSlice";
import { isValidPair } from "@/lib/locale/catalog";
import type { BuddyPersona } from "@/models/userModel";
import type { VoiceStyleId } from "@/lib/voices/catalog";
import type { TranscriptTurn } from "@/app/live_talk/page";

/**
 * Renderless component that hydrates the live-talk session from server state.
 *
 * Two sources, two phases:
 *
 *   1. Redis (fast, warm) — /api/voice/resume returns the user's last
 *      session: { persona, locale, voiceStyle, conversationId, ... }.
 *      Applied to Redux immediately so the UI doesn't show defaults for
 *      a single frame.
 *
 *   2. Mongo (slower, durable) — if there's a conversationId, fetch the
 *      last N messages via /api/conversations/:id/messages and hydrate
 *      the transcripts[] array so the side-panel chat log shows the
 *      conversation history.
 *
 * Idempotent: safe to mount/unmount. Tracks completion in a ref so
 * remounting doesn't re-fetch.
 */

const HISTORY_TURNS = 10;

interface ResumeManagerProps {
  /** Setter from useLiveAudio's parent so we can hydrate transcripts. */
  onRestoreTurns: (turns: TranscriptTurn[]) => void;
  /** Called once the resume cycle completes (success or no-op). */
  onReady?: () => void;
}

interface ResumeResponse {
  session: {
    conversationId: string | null;
    persona: string | null;
    locale: string | null;
    voiceStyle: string | null;
    expression: string | null;
    lastUtteranceAt: number;
    turnCount: number;
  } | null;
}

interface MessagesResponse {
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "tool" | "system";
    content: string;
    createdAt: string;
  }>;
}

export default function ResumeManager({ onRestoreTurns, onReady }: ResumeManagerProps) {
  const dispatch = useAppDispatch();
  const personaStatus = useAppSelector((s) => s.persona.status);
  const localeStatus = useAppSelector((s) => s.locale.status);
  const voiceStatus = useAppSelector((s) => s.voice.status);
  const doneRef = useRef(false);

  useEffect(() => {
    // Wait for the canonical slices to finish their own profile loads,
    // so we don't race them. They write the user's saved (long-term)
    // preferences; we layer the (short-term) live-session state on top.
    if (
      doneRef.current ||
      personaStatus !== "ready" ||
      localeStatus !== "ready" ||
      voiceStatus !== "ready"
    ) {
      return;
    }

    let cancelled = false;
    doneRef.current = true;

    (async () => {
      // ─── Phase 1: Redis (fast warm cache) ───────────────────────────
      let session: ResumeResponse["session"] = null;
      try {
        const res = await fetch("/api/voice/resume", { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as ResumeResponse;
          session = json.session;
        }
      } catch (err) {
        console.warn("[resume] /api/voice/resume failed (ok, falling back):", err);
      }
      if (cancelled) return;

      if (session) {
        // Apply Redis state — but only if it's actually different from
        // what the canonical slices already loaded. Avoids needless
        // re-renders on a cold cache.
        if (
          session.locale &&
          isValidPair(session.locale.split("-")[1]?.toUpperCase() || "", session.locale)
        ) {
          // Note: locale.country in Redis isn't split — we trust the
          // language form (e.g. "hi-IN") and derive country from it.
          const [, region] = session.locale.split("-");
          if (region) {
            dispatch(setLocale({ country: region.toUpperCase(), primaryLanguage: session.locale }));
          }
        }
        if (session.persona) {
          dispatch(setPersona(session.persona as BuddyPersona));
        }
        if (session.voiceStyle) {
          dispatch(setVoiceStyle(session.voiceStyle as VoiceStyleId));
        }
      }

      // ─── Phase 2: Mongo (durable conversation history) ──────────────
      const conversationId = session?.conversationId;
      if (conversationId) {
        try {
          const res = await fetch(
            `/api/conversations/${conversationId}/messages?limit=${HISTORY_TURNS}`,
            { cache: "no-store" }
          );
          if (res.ok) {
            const json = (await res.json()) as MessagesResponse;
            if (!cancelled && json.messages?.length) {
              const turns: TranscriptTurn[] = json.messages
                .filter((m) => m.role === "user" || m.role === "assistant")
                .map((m) => ({
                  id: m.id,
                  role: m.role === "assistant" ? ("ai" as const) : ("user" as const),
                  content: m.content,
                  ts: new Date(m.createdAt).getTime(),
                }));
              if (turns.length > 0) onRestoreTurns(turns);
            }
          }
        } catch (err) {
          console.warn("[resume] messages fetch failed:", err);
        }
      }

      if (!cancelled) onReady?.();
    })();

    return () => {
      cancelled = true;
    };
  }, [personaStatus, localeStatus, voiceStatus, dispatch, onRestoreTurns, onReady]);

  return null;
}
