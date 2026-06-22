"use client";

import { useRef, useCallback } from "react";
import { toast } from "sonner";

const TTS_MIN_BATCH_CHARS = 30;
let lastQuotaToastAt = 0;

function showQuotaToast(body: { reset_at_ms?: number; resource?: string; detail?: { reset_at_ms?: number; resource?: string } } | null) {
  const now = Date.now();
  if (now - lastQuotaToastAt < 60_000) return;
  lastQuotaToastAt = now;
  const data = body?.detail ?? body ?? {};
  const resetAt = data.reset_at_ms ?? now + 60 * 60 * 1000;
  const minsLeft = Math.max(1, Math.ceil((resetAt - now) / 60000));
  const hrs = Math.floor(minsLeft / 60);
  const mins = minsLeft % 60;
  const when = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  toast.error(`Daily voice limit reached. Resets in ${when}.`, { duration: 8000 });
}

interface UseTTSQueueParams {
  languageRef: React.RefObject<string> | undefined;
  voiceStyleRef: React.RefObject<string> | undefined;
  personaRef: React.RefObject<string> | undefined;
  stoppedRef: React.MutableRefObject<boolean>;
  setPhase: React.Dispatch<React.SetStateAction<string>>;
  setOutputAudioLevel: React.Dispatch<React.SetStateAction<number>>;
  setAiResponse: React.Dispatch<React.SetStateAction<string>>;
}

export function useTTSQueue(params: UseTTSQueueParams) {
  const { languageRef, voiceStyleRef, personaRef, stoppedRef, setPhase, setOutputAudioLevel, setAiResponse } = params;

  const ttsQueueRef = useRef<HTMLAudioElement[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsBufferRef = useRef("");
  const ttsActiveRef = useRef(false);
  const outputEnvelopeRef = useRef<number | null>(null);

  // --- Playback ---
  const playNextTts = useCallback(() => {
    if (currentAudioRef.current) return;
    const next = ttsQueueRef.current.shift();
    if (!next) {
      ttsActiveRef.current = false;
      if (outputEnvelopeRef.current !== null) {
        clearInterval(outputEnvelopeRef.current);
        outputEnvelopeRef.current = null;
      }
      setOutputAudioLevel(0);
      setPhase((p: string) => (p === "speaking" ? "listening" : p));
      return;
    }
    currentAudioRef.current = next;
    setPhase("speaking");

    if (outputEnvelopeRef.current === null) {
      outputEnvelopeRef.current = window.setInterval(() => {
        setOutputAudioLevel(35 + Math.random() * 50);
      }, 120);
    }

    next.play().catch((err) => {
      console.error("[live] audio playback failed:", err);
      currentAudioRef.current = null;
      playNextTts();
    });
  }, [setPhase, setOutputAudioLevel]);

  const enqueueTts = useCallback(
    async (text: string) => {
      if (stoppedRef.current) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      ttsActiveRef.current = true;
      try {
        const res = await fetch("/api/voice/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            lang: languageRef?.current ?? "en-US",
            voiceStyle: voiceStyleRef?.current ?? null,
            persona: personaRef?.current ?? null,
          }),
        });
        if (!res.ok) {
          const reason = await res.json().catch(() => null);
          console.warn("[live] TTS http error:", res.status, reason);
          if (res.status === 429) showQuotaToast(reason);
          return;
        }
        const blob = await res.blob();
        if (stoppedRef.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = "auto";
        try { audio.load(); } catch { /* some browsers throw on detached audio */ }
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          playNextTts();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          playNextTts();
        };
        ttsQueueRef.current.push(audio);
        playNextTts();
      } catch (err) {
        console.error("[live] TTS fetch failed:", err);
      }
    },
    [playNextTts, languageRef, voiceStyleRef, personaRef, stoppedRef]
  );

  const flushTtsBuffer = useCallback(() => {
    const remaining = ttsBufferRef.current.trim();
    ttsBufferRef.current = "";
    if (remaining) void enqueueTts(remaining);
  }, [enqueueTts]);

  const onChatToken = useCallback(
    (chunk: string) => {
      setAiResponse((prev) => prev + chunk);
      ttsBufferRef.current += chunk;
      const buf = ttsBufferRef.current;
      const match = buf.match(/^([\s\S]+?[.!?])(\s+|$)/);
      if (match && match[1].length >= TTS_MIN_BATCH_CHARS) {
        ttsBufferRef.current = buf.slice(match[0].length);
        void enqueueTts(match[1]);
      }
    },
    [enqueueTts, setAiResponse]
  );

  const interrupt = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    ttsQueueRef.current.forEach((a) => a.pause());
    ttsQueueRef.current = [];
    ttsBufferRef.current = "";
    ttsActiveRef.current = false;
    if (outputEnvelopeRef.current !== null) {
      clearInterval(outputEnvelopeRef.current);
      outputEnvelopeRef.current = null;
    }
    setOutputAudioLevel(0);
  }, [setOutputAudioLevel]);

  const cleanup = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    ttsQueueRef.current.forEach((a) => a.pause());
    ttsQueueRef.current = [];
    ttsBufferRef.current = "";
    ttsActiveRef.current = false;
    if (outputEnvelopeRef.current !== null) {
      clearInterval(outputEnvelopeRef.current);
      outputEnvelopeRef.current = null;
    }
    setOutputAudioLevel(0);
  }, [setOutputAudioLevel]);

  return {
    ttsActiveRef,
    ttsQueueRef,
    currentAudioRef,
    enqueueTts,
    flushTtsBuffer,
    onChatToken,
    interruptTts: interrupt,
    cleanupTts: cleanup,
  };
}
