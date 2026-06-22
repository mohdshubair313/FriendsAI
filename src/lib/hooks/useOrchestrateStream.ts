"use client";

import { useRef, useCallback } from "react";
import { toast } from "sonner";

interface OrchestrateCallbacks {
  onToken?: (chunk: string) => void;
  onDone?: () => void;
}

interface UseOrchestrateStreamParams {
  expressionRef: React.RefObject<string> | undefined;
  personaRef: React.RefObject<string> | undefined;
  voiceStyleRef: React.RefObject<string> | undefined;
  languageRef: React.RefObject<string> | undefined;
  stoppedRef: React.MutableRefObject<boolean>;
  transcriptsRef: React.MutableRefObject<Array<{ id: string; role: "user" | "ai"; content: string; ts: number }>>;
  callbacksRef: React.MutableRefObject<OrchestrateCallbacks>;
  setPhase: React.Dispatch<React.SetStateAction<string>>;
  setAiResponse: React.Dispatch<React.SetStateAction<string>>;
  setTranscripts: React.Dispatch<React.SetStateAction<Array<{ id: string; role: "user" | "ai"; content: string; ts: number }>>>;
}

export function useOrchestrateStream(params: UseOrchestrateStreamParams) {
  const {
    expressionRef,
    personaRef,
    voiceStyleRef,
    languageRef,
    stoppedRef,
    transcriptsRef,
    callbacksRef,
    setPhase,
    setAiResponse,
    setTranscripts,
  } = params;

  const conversationIdRef = useRef<string | null>(null);
  const orchestrateAbortRef = useRef<AbortController | null>(null);
  const prevPersonaRef = useRef<string | null>(null);

  const sendTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || stoppedRef.current) return;

      setPhase("thinking");
      const ac = new AbortController();
      orchestrateAbortRef.current = ac;
      setAiResponse("");

      let acc = "";
      const expression = expressionRef?.current ?? null;
      const persona = personaRef?.current ?? null;

      const HISTORY_MAX_CHARS = 16_000;
      const HISTORY_MAX_TURNS = 20;
      const past = transcriptsRef.current;
      const windowed = past.slice(-HISTORY_MAX_TURNS);
      const kept: Array<{ id: string; role: "user" | "ai"; content: string; ts: number }> = [];
      let charBudget = HISTORY_MAX_CHARS - transcript.length;
      for (let i = windowed.length - 1; i >= 0; i--) {
        const t = windowed[i];
        if (charBudget - t.content.length < 0) break;
        kept.unshift(t);
        charBudget -= t.content.length;
      }
      const historyMessages = kept.map((t) => ({
        role: t.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: t.content,
      }));

      const personaSwitchMarker =
        prevPersonaRef.current && prevPersonaRef.current !== persona
          ? [
              {
                role: "system" as const,
                content: `[persona switch: now playing ${persona}. Drop the prior character; behave consistently with the new role from this point on.]`,
              },
            ]
          : [];
      prevPersonaRef.current = persona;

      const messagesPayload = [
        ...personaSwitchMarker,
        ...historyMessages,
        { role: "user" as const, content: transcript },
      ];

      try {
        const res = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesPayload,
            mood: null,
            conversationId: conversationIdRef.current,
            expression: expression && expression !== "neutral" ? expression : null,
            persona,
            voiceStyle: voiceStyleRef?.current ?? null,
            locale: languageRef?.current ?? null,
          }),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            const line = frame.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            try {
              const evt = JSON.parse(line.slice(6).trim()) as {
                type: string;
                content?: string;
                id?: string;
              };
              if (evt.type === "conversation" && evt.id) {
                conversationIdRef.current = evt.id;
              } else if (evt.type === "token" && evt.content) {
                acc += evt.content;
                callbacksRef.current.onToken?.(evt.content);
              } else if (evt.type === "done" || evt.type === "aborted") {
                callbacksRef.current.onDone?.();
              }
            } catch { /* malformed frame */ }
          }
        }
        callbacksRef.current.onDone?.();
        const trimmed = acc.trim();
        if (trimmed) {
          setTranscripts((prev) => [
            ...prev,
            { id: `ai-${Date.now()}`, role: "ai" as const, content: trimmed, ts: Date.now() },
          ]);
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("[live] orchestrate failed:", err);
        toast.error("Connection lost. Try again.");
        setPhase("listening");
      } finally {
        orchestrateAbortRef.current = null;
      }
    },
    [
      expressionRef, personaRef, voiceStyleRef, languageRef,
      stoppedRef, transcriptsRef, callbacksRef,
      setPhase, setAiResponse, setTranscripts,
    ]
  );

  const abortStream = useCallback(() => {
    orchestrateAbortRef.current?.abort();
    orchestrateAbortRef.current = null;
  }, []);

  const cleanupOrch = useCallback(() => {
    orchestrateAbortRef.current?.abort();
    orchestrateAbortRef.current = null;
  }, []);

  return {
    sendTranscript,
    abortStream,
    cleanupOrch,
    conversationIdRef,
    orchestrateAbortRef,
    prevPersonaRef,
  };
}
