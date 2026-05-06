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

/**
 * Live voice conversation, Cloudflare-powered (Tier 3 voice pipeline):
 *
 *   🎤 mic → MediaRecorder + amplitude-VAD
 *      → POST /api/voice/transcribe (Cloudflare Whisper Large v3 Turbo)
 *      → POST /api/orchestrate      (Gemma 3 27B, sentence-streamed)
 *      → POST /api/voice/synthesize (Cloudflare MeloTTS, per sentence)
 *      → 🔊 <audio> playback
 *
 * Why this design:
 *   - Browser SpeechRecognition is free but accuracy varies wildly per OS.
 *     Whisper Turbo is consistent across devices.
 *   - Browser SpeechSynthesis sounds robotic. MeloTTS sounds natural.
 *   - We sentence-stream TTS so the AI starts talking ~2s after the user
 *     stops, instead of waiting 6-10s for a full LLM reply + one TTS call.
 *   - VAD is paused while the AI is speaking + the mic uses
 *     echoCancellation, so the AI can't hear itself in the speakers.
 */

// ─── VAD tuning constants ────────────────────────────────────────────────────
// Average byte frequency (0-255) above which we consider mic input "speech".
const VAD_SPEECH_THRESHOLD = 14;
// Average amplitude must drop below threshold for this long for us to call
// the utterance "ended" and stop the recorder.
const VAD_SILENCE_DURATION_MS = 1200;
// Discard captured audio shorter than this (likely just a noise spike).
const MIN_UTTERANCE_MS = 350;
// Flush a TTS request once buffered text ends with terminal punctuation
// AND has at least this many characters (avoids tiny "Ok." clips).
const TTS_MIN_BATCH_CHARS = 30;

// ─── Hook ────────────────────────────────────────────────────────────────────

type VoicePhase = "idle" | "listening" | "transcribing" | "thinking" | "speaking";

function useLiveAudio() {
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [audioLevel, setAudioLevel] = useState(0);          // 0-100
  const [outputAudioLevel, setOutputAudioLevel] = useState(0); // 0-100, synthetic envelope

  // Long-lived browser primitives
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rafRef = useRef<number | null>(null);

  // Capture state
  const recordedChunksRef = useRef<Blob[]>([]);
  const captureStartedAtRef = useRef<number>(0);
  const speakingRef = useRef(false);
  const silenceStartRef = useRef<number>(0);

  // Conversation state
  const conversationIdRef = useRef<string | null>(null);
  const orchestrateAbortRef = useRef<AbortController | null>(null);

  // TTS pipeline
  const ttsQueueRef = useRef<HTMLAudioElement[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsBufferRef = useRef<string>("");
  const ttsActiveRef = useRef(false); // any TTS audio queued or playing
  const outputEnvelopeRef = useRef<number | null>(null);

  // Lifecycle flag — true once stop() has been called, so async tasks bail.
  const stoppedRef = useRef(false);

  // ─── TTS playback queue ───────────────────────────────────────────────
  const playNextTts = useCallback(() => {
    if (currentAudioRef.current) return; // one-at-a-time playback
    const next = ttsQueueRef.current.shift();
    if (!next) {
      // Queue drained
      ttsActiveRef.current = false;
      if (outputEnvelopeRef.current !== null) {
        clearInterval(outputEnvelopeRef.current);
        outputEnvelopeRef.current = null;
      }
      setOutputAudioLevel(0);
      // Only return to listening if we're not in the middle of a fresh
      // user utterance / LLM call.
      setPhase((p) => (p === "speaking" ? "listening" : p));
      return;
    }
    currentAudioRef.current = next;
    setPhase("speaking");

    // Synthetic envelope so the visualiser bounces while audio plays.
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
  }, []);

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
          body: JSON.stringify({ text: trimmed }),
        });
        if (!res.ok) {
          const reason = await res.json().catch(() => null);
          console.warn("[live] TTS http error:", res.status, reason);
          return;
        }
        const blob = await res.blob();
        if (stoppedRef.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
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
    [playNextTts]
  );

  const flushTtsBuffer = useCallback(() => {
    const remaining = ttsBufferRef.current.trim();
    ttsBufferRef.current = "";
    if (remaining) void enqueueTts(remaining);
  }, [enqueueTts]);

  // Token from the LLM stream → batched into sentence-sized TTS calls.
  const onChatToken = useCallback(
    (chunk: string) => {
      ttsBufferRef.current += chunk;
      const buf = ttsBufferRef.current;
      // Match a sentence ending at a terminal punctuation mark.
      const match = buf.match(/^([\s\S]+?[.!?])(\s+|$)/);
      if (match && match[1].length >= TTS_MIN_BATCH_CHARS) {
        ttsBufferRef.current = buf.slice(match[0].length);
        void enqueueTts(match[1]);
      }
    },
    [enqueueTts]
  );

  // ─── /api/orchestrate streaming ───────────────────────────────────────
  const sendTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || stoppedRef.current) return;

      setPhase("thinking");
      const ac = new AbortController();
      orchestrateAbortRef.current = ac;

      try {
        const res = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: transcript }],
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
                onChatToken(evt.content);
              } else if (evt.type === "done" || evt.type === "aborted") {
                flushTtsBuffer();
              }
            } catch { /* malformed frame */ }
          }
        }
        flushTtsBuffer();
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("[live] orchestrate failed:", err);
        toast.error("Connection lost. Try again.");
        setPhase("listening");
      } finally {
        orchestrateAbortRef.current = null;
      }
    },
    [onChatToken, flushTtsBuffer]
  );

  // ─── Whisper transcription ────────────────────────────────────────────
  const transcribeAndReply = useCallback(
    async (audioBlob: Blob) => {
      if (stoppedRef.current) return;
      setPhase("transcribing");
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "utterance.webm");
        const res = await fetch("/api/voice/transcribe", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          console.warn("[live] transcribe http error:", res.status, err);
          setPhase("listening");
          return;
        }
        const { text } = (await res.json()) as { text: string };
        if (!text.trim()) {
          setPhase("listening");
          return;
        }
        await sendTranscript(text);
      } catch (err) {
        console.error("[live] transcribe failed:", err);
        toast.error("Couldn't hear that — try again.");
        setPhase("listening");
      }
    },
    [sendTranscript]
  );

  // ─── Mic capture lifecycle ────────────────────────────────────────────

  // Stops the current recording and ships the chunks off for transcription.
  const finalizeUtterance = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state !== "recording") return;
    const startedAt = captureStartedAtRef.current;
    captureStartedAtRef.current = 0;
    speakingRef.current = false;
    silenceStartRef.current = 0;

    // MediaRecorder.stop() flushes a final dataavailable event. We collect
    // the chunks in onstop so we can package them and (maybe) restart.
    recorder.onstop = () => {
      const dur = startedAt ? Date.now() - startedAt : 0;
      const chunks = recordedChunksRef.current;
      recordedChunksRef.current = [];
      if (dur >= MIN_UTTERANCE_MS && chunks.length) {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        void transcribeAndReply(blob);
      } else {
        // Too short — discard and resume listening.
        setPhase("listening");
      }
      // Restart the recorder so we're ready for the next utterance.
      try {
        if (!stoppedRef.current) recorder.start(200);
      } catch { /* already started */ }
    };
    recorder.stop();
  }, [transcribeAndReply]);

  // ─── Audio analyser tick (also drives input level) ────────────────────
  const tick = useCallback(() => {
    if (stoppedRef.current) return;
    const analyser = analyserRef.current;
    if (!analyser) return;
    const bins = analyser.frequencyBinCount;
    const data = new Uint8Array(bins);
    analyser.getByteFrequencyData(data);

    let sum = 0;
    for (let i = 0; i < bins; i++) sum += data[i];
    const avg = sum / bins;
    setAudioLevel(Math.min(100, (avg / 128) * 100));

    // VAD is paused while the AI is talking so the mic doesn't pick up
    // the speakers. Echo cancellation in getUserMedia helps too, but
    // gating is the reliable belt-and-suspenders.
    if (!ttsActiveRef.current) {
      if (avg > VAD_SPEECH_THRESHOLD) {
        if (!speakingRef.current) {
          speakingRef.current = true;
          captureStartedAtRef.current = Date.now();
          setPhase("listening"); // visual cue the mic picked up speech
        }
        silenceStartRef.current = 0;
      } else if (speakingRef.current) {
        if (silenceStartRef.current === 0) {
          silenceStartRef.current = Date.now();
        } else if (Date.now() - silenceStartRef.current > VAD_SILENCE_DURATION_MS) {
          finalizeUtterance();
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [finalizeUtterance]);

  // ─── Start / stop session ─────────────────────────────────────────────
  const start = useCallback(async () => {
    stoppedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const Ctor = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
      const ctx = new Ctor();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      // Pick a mimeType the browser actually supports. Chrome → opus,
      // Safari → mp4. Whisper handles both.
      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
        MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" :
        MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" :
        "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      // First-pass onstop is overwritten in finalizeUtterance to handle the
      // captured chunks. Default no-op so the recorder is happy on init.
      recorder.onstop = () => {};
      recorderRef.current = recorder;
      recorder.start(200); // 200ms chunks

      setPhase("listening");
      tick();
    } catch (err) {
      console.error("[live] mic start failed:", err);
      toast.error(
        (err as { name?: string })?.name === "NotAllowedError"
          ? "Microphone permission denied."
          : "Couldn't access your microphone."
      );
      setPhase("idle");
    }
  }, [tick]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    try { recorderRef.current?.stop(); } catch { /* not recording */ }
    recorderRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;

    orchestrateAbortRef.current?.abort();
    orchestrateAbortRef.current = null;

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

    speakingRef.current = false;
    silenceStartRef.current = 0;
    recordedChunksRef.current = [];
    captureStartedAtRef.current = 0;

    setPhase("idle");
    setAudioLevel(0);
    setOutputAudioLevel(0);
  }, []);

  // ─── Interrupt: cut off AI mid-sentence ───────────────────────────────
  const interrupt = useCallback(async () => {
    // Drop any queued / playing audio
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

    // Abort the in-flight LLM stream
    orchestrateAbortRef.current?.abort();

    setPhase("listening");

    // Best-effort server signal (the route is a stub today)
    try {
      await fetch("/api/voice/interrupt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: conversationIdRef.current ?? "live" }),
      });
    } catch { /* server stub is best-effort */ }
  }, []);

  // Auto-start on mount, full cleanup on unmount.
  useEffect(() => {
    void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isStreaming: phase !== "idle",
    isModelSpeaking: phase === "speaking",
    audioLevel,
    outputAudioLevel,
    interrupt,
    stop,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LiveTalkPage() {
  const { status: sessionStatus } = useSession();
  const isPremium = useAppSelector((s) => s.premium.isPremium);
  const premiumStatus = useAppSelector((s) => s.premium.status);
  const router = useRouter();

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
