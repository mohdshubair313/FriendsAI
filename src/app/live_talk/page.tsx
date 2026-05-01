"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import LiveTalkOverlay from "@/components/chatComponents/LiveTalkOverlay";
import LiveTalkTeaser from "@/components/chatComponents/LiveTalkTeaser";
import { toast } from "sonner";
import { motion } from "framer-motion";

// ─── Browser SpeechRecognition typings ──────────────────────────────────────
type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = { isFinal: boolean; 0: SpeechRecognitionAlternative };
type SpeechRecognitionEvent = { resultIndex: number; results: SpeechRecognitionResult[] };
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/**
 * Hook that wires the full browser-API live conversation stack:
 *
 *   mic → AnalyserNode → audioLevel
 *   recognition → final transcript → /api/orchestrate (SSE)
 *   each token chunk → sentence accumulator → SpeechSynthesisUtterance queue
 *   utterance.onstart/onend → isModelSpeaking + outputAudioLevel envelope
 *
 * No WebRTC, no Gemini Live — those are a separate epic. This is the
 * working "press the mic and talk to the AI" experience.
 */
function useLiveAudio() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sentenceBufferRef = useRef<string>("");
  const utterQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const speakingRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);
  const stoppedRef = useRef(false);

  const speakNext = useCallback(() => {
    if (typeof window === "undefined") return;
    if (speakingRef.current) return;
    const u = utterQueueRef.current.shift();
    if (!u) {
      setIsModelSpeaking(false);
      setOutputAudioLevel(0);
      return;
    }
    speakingRef.current = true;
    setIsModelSpeaking(true);
    // Synthetic envelope so the visualiser bobs while voice plays.
    setOutputAudioLevel(40 + Math.random() * 40);
    u.onend = () => {
      speakingRef.current = false;
      speakNext();
    };
    u.onerror = () => {
      speakingRef.current = false;
      speakNext();
    };
    window.speechSynthesis.speak(u);
  }, []);

  const enqueueSentence = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const u = new SpeechSynthesisUtterance(
        trimmed.replace(/[`*_#>]/g, "").replace(/\[(.*?)\]\([^)]*\)/g, "$1")
      );
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.name.includes("Google US English") || v.name.includes("Samantha") || v.lang === "en-US"
      );
      if (preferred) u.voice = preferred;
      u.rate = 1;
      u.pitch = 1;
      utterQueueRef.current.push(u);
      speakNext();
    },
    [speakNext]
  );

  // Pump tokens into a sentence accumulator. Flush on terminal punctuation.
  const onToken = useCallback(
    (chunk: string) => {
      sentenceBufferRef.current += chunk;
      const buf = sentenceBufferRef.current;
      const m = buf.match(/^([\s\S]*?[.!?])(\s+|$)/);
      if (m) {
        const sentence = m[1];
        sentenceBufferRef.current = buf.slice(m[0].length);
        enqueueSentence(sentence);
      }
    },
    [enqueueSentence]
  );

  const flushPendingSentence = useCallback(() => {
    if (sentenceBufferRef.current.trim()) {
      enqueueSentence(sentenceBufferRef.current);
      sentenceBufferRef.current = "";
    }
  }, [enqueueSentence]);

  // ─── /api/orchestrate streaming ───────────────────────────────────────
  const sendTranscript = useCallback(
    async (text: string) => {
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: text }],
            mood: null,
            conversationId: conversationIdRef.current,
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
                onToken(evt.content);
              } else if (evt.type === "done" || evt.type === "aborted") {
                flushPendingSentence();
              }
            } catch {/* ignore malformed frame */}
          }
        }
        flushPendingSentence();
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[live] orchestrate failed:", err);
          toast.error("Connection lost. Try again.");
        }
      } finally {
        abortRef.current = null;
      }
    },
    [onToken, flushPendingSentence]
  );

  // ─── Recognition wiring ─────────────────────────────────────────────────
  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current || typeof window === "undefined") return recognitionRef.current;
    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Speech recognition is not supported in this browser.");
      return null;
    }
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (event: SpeechRecognitionEvent) => {
      const idx = event.resultIndex;
      const text = event.results[idx]?.[0]?.transcript ?? "";
      if (event.results[idx]?.isFinal && text.trim()) {
        void sendTranscript(text.trim());
      }
    };
    r.onerror = (e: any) => {
      // "no-speech" / "aborted" are routine — don't toast on those.
      if (e?.error && e.error !== "no-speech" && e.error !== "aborted") {
        console.warn("[live] recognition error:", e.error);
      }
    };
    r.onend = () => {
      // Auto-restart unless the user explicitly stopped the session.
      if (!stoppedRef.current) {
        try {
          r.start();
        } catch {/* already running */}
      }
    };
    recognitionRef.current = r;
    return r;
  }, [sendTranscript]);

  // ─── Mic + analyser wiring ──────────────────────────────────────────────
  const start = useCallback(async () => {
    stoppedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const Ctor = (window.AudioContext ||
        (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new Ctor();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        // Normalise to 0-100 with a bit of head-room.
        setAudioLevel(Math.min(100, (avg / 128) * 100));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const r = ensureRecognition();
      if (r) {
        try { r.start(); } catch {/* already started */}
      }
      setIsStreaming(true);
    } catch (err: any) {
      console.error("[live] mic start failed:", err);
      toast.error(
        err?.name === "NotAllowedError"
          ? "Microphone permission denied."
          : "Couldn't access your microphone."
      );
    }
  }, [ensureRecognition]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    utterQueueRef.current = [];
    sentenceBufferRef.current = "";
    speakingRef.current = false;
    setIsStreaming(false);
    setIsModelSpeaking(false);
    setAudioLevel(0);
    setOutputAudioLevel(0);
  }, []);

  const interrupt = useCallback(async () => {
    // Stop speech, drop the queue, abort the in-flight HTTP stream.
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    utterQueueRef.current = [];
    sentenceBufferRef.current = "";
    speakingRef.current = false;
    setIsModelSpeaking(false);
    setOutputAudioLevel(0);
    abortRef.current?.abort();
    try {
      await fetch("/api/voice/interrupt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: conversationIdRef.current ?? "live" }),
      });
    } catch {/* server stub is best-effort */}
  }, []);

  // Auto-start on mount, clean up on unmount.
  useEffect(() => {
    void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isStreaming,
    isModelSpeaking,
    audioLevel,
    outputAudioLevel,
    interrupt,
    stop,
  };
}

export default function LiveTalkPage() {
  const { status: sessionStatus } = useSession();
  const isPremium = useAppSelector((s) => s.premium.isPremium);
  const premiumStatus = useAppSelector((s) => s.premium.status);
  const router = useRouter();

  // Entitlement gate
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (premiumStatus === "success" && !isPremium) {
      toast.error("LiveTalk is a Pro feature. Redirecting…");
      setTimeout(() => router.push("/premium"), 1500);
    }
  }, [sessionStatus, isPremium, premiumStatus, router]);

  const eligible = sessionStatus === "authenticated" && (premiumStatus !== "success" || isPremium);

  // Only mount the live audio hook once the user is allowed in — it asks
  // for the mic permission immediately, so we don't want it firing on
  // the loading / teaser branches.
  if (sessionStatus === "loading" || premiumStatus === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 z-10"
        >
          <div className="size-16 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
            Authenticating Neural Link
          </span>
        </motion.div>
      </div>
    );
  }

  if (premiumStatus === "success" && !isPremium) {
    return <LiveTalkTeaser />;
  }

  if (!eligible) return null;

  return <LiveTalkSession onClose={() => router.push("/chat")} />;
}

function LiveTalkSession({ onClose }: { onClose: () => void }) {
  const { isStreaming, isModelSpeaking, audioLevel, outputAudioLevel, interrupt, stop } = useLiveAudio();

  return (
    <LiveTalkOverlay
      isStreaming={isStreaming}
      isModelSpeaking={isModelSpeaking}
      audioLevel={audioLevel}
      outputAudioLevel={outputAudioLevel}
      onClose={() => {
        stop();
        onClose();
      }}
      onInterrupt={interrupt}
      emotion="calm"
    />
  );
}
