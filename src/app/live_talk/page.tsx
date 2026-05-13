"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { loadLocale } from "@/store/slices/localeSlice";
import { loadVoice } from "@/store/slices/voiceSlice";
import LiveTalkTeaser from "@/components/chatComponents/LiveTalkTeaser";
import MeetView from "@/components/livetalk/MeetView";
import OnboardingWizard from "@/components/livetalk/OnboardingWizard";
import ResumeManager from "@/components/livetalk/ResumeManager";
import ReconnectOverlay from "@/components/livetalk/ReconnectOverlay";
import { useNetworkState } from "@/lib/hooks/useNetworkState";
import { PERSONAS } from "@/lib/chat/personas";
import { useFaceLandmarks } from "@/lib/face/useFaceLandmarks";
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

// ─── Quota 429 helper ────────────────────────────────────────────────────────

/**
 * Renders a non-blocking toast when the voice service returns 429 Daily
 * limit reached. Shows when capacity frees up so the user isn't blocked
 * on a vague timeline.
 *
 * Body shape comes from voice-service/app/quota.py:to_429_body():
 *   { error, resource, used, limit, reset_at_ms }
 *
 * We also dedupe — surface at most one toast per 60s so a chatty client
 * doesn't pile up duplicate banners.
 */
let lastQuotaToastAt = 0;
function showQuotaToast(body: { reset_at_ms?: number; resource?: string; detail?: { reset_at_ms?: number; resource?: string } } | null) {
  const now = Date.now();
  if (now - lastQuotaToastAt < 60_000) return;
  lastQuotaToastAt = now;
  // FastAPI nests under `detail`; Next.js direct responses may flatten.
  const data = body?.detail ?? body ?? {};
  const resetAt = data.reset_at_ms ?? now + 60 * 60 * 1000;
  const minsLeft = Math.max(1, Math.ceil((resetAt - now) / 60000));
  const hrs = Math.floor(minsLeft / 60);
  const mins = minsLeft % 60;
  const when = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  toast.error(`Daily voice limit reached. Resets in ${when}.`, { duration: 8000 });
}

// ─── VAD tuning constants ────────────────────────────────────────────────────
// Average byte frequency (0-255) above which we consider mic input "speech".
// Raised 14 → 22: breathing + mouse-click noise was triggering false positives
// → 1-2 frame utterances → Whisper hallucinations like "कर दो दो दो दो".
const VAD_SPEECH_THRESHOLD = 22;
// Barge-in threshold (higher) — while AI is speaking, ignore residual echo
// and only trip on genuine user speech. echoCancellation in getUserMedia
// handles 90% of it, this is the belt-and-suspenders 10%.
const VAD_BARGE_IN_THRESHOLD = 36;
// User must hold above the barge-in threshold for at least this many ms
// before we cancel the AI's speech. Prevents a single cough from killing
// the entire reply.
const BARGE_IN_HOLD_MS = 250;
// Average amplitude must drop below threshold for this long for us to call
// the utterance "ended" and stop the recorder.
const VAD_SILENCE_DURATION_MS = 1200;
// Discard captured audio shorter than this. Bumped 350 → 700ms because:
//   - Whisper Large v3 Turbo hallucinates repetitive Hindi tokens on very
//     short clips (e.g. "दो दो दो दो")
//   - WebM/Opus needs ~200-300ms to flush a valid EBML init segment;
//     finalizing before that yields code 3030 "Failed to decode audio file"
const MIN_UTTERANCE_MS = 700;
// Minimum recorder uptime before VAD can finalize it. Without this, a fast
// retrigger immediately after the previous utterance's onstop ships a blob
// with no WebM init segment → Cloudflare returns code 3030.
const MIN_RECORDER_UPTIME_MS = 300;
// Flush a TTS request once buffered text ends with terminal punctuation
// AND has at least this many characters (avoids tiny "Ok." clips).
const TTS_MIN_BATCH_CHARS = 30;

// ─── Hook ────────────────────────────────────────────────────────────────────

type VoicePhase = "idle" | "listening" | "transcribing" | "thinking" | "speaking";

export interface TranscriptTurn {
  id: string;
  role: "user" | "ai";
  content: string;
  ts: number; // ms epoch
}

interface UseLiveAudioOptions {
  /** When true, getUserMedia requests video too (powers MediaPipe face detection). */
  cameraEnabled: boolean;
  /** Read by sendTranscript to attach the latest face expression to the orchestrate call. */
  expressionRef?: React.RefObject<string>;
  /** Read by sendTranscript to tell the LLM which persona to roleplay. */
  personaRef?: React.RefObject<string>;
  /** Full BCP-47 language code (e.g. "hi-IN"). Server routes to Sarvam vs
   *  Cloudflare based on this. */
  languageRef?: React.RefObject<string>;
  /** User's chosen voice style id ("warm_female", etc.). Server resolves
   *  it to a Sarvam speaker name per (language, style). */
  voiceStyleRef?: React.RefObject<string>;
}

function useLiveAudio({
  cameraEnabled,
  expressionRef,
  personaRef,
  languageRef,
  voiceStyleRef,
}: UseLiveAudioOptions) {
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [audioLevel, setAudioLevel] = useState(0);          // 0-100
  const [outputAudioLevel, setOutputAudioLevel] = useState(0); // 0-100, synthetic envelope
  const [userTranscript, setUserTranscript] = useState("");      // last user STT
  const [aiResponse, setAiResponse] = useState("");              // streaming AI text
  // Full chat history of the live session (in-memory only — server already
  // saves messages via /api/orchestrate's Mongo writes, this is just for
  // the SidePanel ChatLog).
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([]);
  // Mirror as a ref so sendTranscript (a stable useCallback) can read the
  // latest history without re-creating itself on every turn.
  const transcriptsRef = useRef<TranscriptTurn[]>([]);
  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);
  // The active video stream (when cameraEnabled). Exposed so the parent can
  // hand it to useFaceLandmarks for facial expression detection.
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

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
  // Wall-clock time the active recorder was started. Used to gate VAD
  // from finalizing too early (before WebM EBML init segment is emitted).
  const recorderStartedAtRef = useRef<number>(0);
  // Wall-clock time the user started sustained speech ABOVE the barge-in
  // threshold WHILE the AI was talking. Once it crosses BARGE_IN_HOLD_MS,
  // we cancel the AI mid-sentence.
  const bargeInStartRef = useRef<number>(0);
  // Indirection so tick (defined before interrupt) can still call it.
  const interruptRef = useRef<() => void>(() => {});

  // Conversation state
  const conversationIdRef = useRef<string | null>(null);
  const orchestrateAbortRef = useRef<AbortController | null>(null);
  // Tracks the persona used on the previous orchestrate turn. Diffing
  // against the current persona lets us inject a [persona switch] system
  // marker so the LLM doesn't carry over the prior character mid-stream.
  const prevPersonaRef = useRef<string | null>(null);

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
          body: JSON.stringify({
            text: trimmed,
            lang: languageRef?.current ?? "en-US",
            voiceStyle: voiceStyleRef?.current ?? null,
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
        // Jitter buffer: tell the browser to download + decode the file
        // eagerly. By the time playNextTts pops it off the queue, the
        // decoded PCM is in memory → zero-latency start → no gap between
        // sentences → no "pop" / "crack" at sentence boundaries.
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
    [playNextTts, languageRef, voiceStyleRef]
  );

  const flushTtsBuffer = useCallback(() => {
    const remaining = ttsBufferRef.current.trim();
    ttsBufferRef.current = "";
    if (remaining) void enqueueTts(remaining);
  }, [enqueueTts]);

  // Token from the LLM stream → batched into sentence-sized TTS calls.
  const onChatToken = useCallback(
    (chunk: string) => {
      setAiResponse((prev) => prev + chunk);
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

      setAiResponse(""); // reset for the new turn
      // Snapshot the AI accumulator so we can push the full reply once
      // streaming completes. We can't read state inside the loop reliably.
      let acc = "";
      const expression = expressionRef?.current ?? null;
      const persona = personaRef?.current ?? null;

      // Build the multi-turn history so the LLM actually remembers context.
      // Previously we sent only the latest user message — the model had no
      // idea what was said 2 turns ago. Now: last N turns trimmed by a
      // character budget that roughly maps to a ~4K-token context window
      // (4 chars per token rule of thumb).
      const HISTORY_MAX_CHARS = 16_000;
      const HISTORY_MAX_TURNS = 20;
      const past = transcriptsRef.current;
      const windowed = past.slice(-HISTORY_MAX_TURNS);
      // Walk from newest backwards, accumulating chars until budget hit.
      const kept: TranscriptTurn[] = [];
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
      // If persona changed since the last turn, slip a system marker in so
      // the LLM consciously switches character instead of bleeding the
      // previous tone into a fresh role (Doctor accidentally cracking jokes
      // because Comedian was active 30 seconds ago, etc.).
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
            // From MediaPipe (when face detection is on). LLM uses it to
            // tailor reactions: "you look surprised — what's up?"
            expression: expression && expression !== "neutral" ? expression : null,
            persona,
            // Persisted to Redis (not consumed by LLM) so reconnects pick
            // up the right voice + language without a profile round-trip.
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
                onChatToken(evt.content);
              } else if (evt.type === "done" || evt.type === "aborted") {
                flushTtsBuffer();
              }
            } catch { /* malformed frame */ }
          }
        }
        flushTtsBuffer();
        // Push the completed AI turn to history. Empty replies (rare) are
        // still pushed so the timeline doesn't lie.
        const trimmed = acc.trim();
        if (trimmed) {
          setTranscripts((prev) => [
            ...prev,
            { id: `ai-${Date.now()}`, role: "ai", content: trimmed, ts: Date.now() },
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
    [onChatToken, flushTtsBuffer, expressionRef, personaRef, voiceStyleRef, languageRef]
  );

  // ─── Whisper transcription ────────────────────────────────────────────
  const transcribeAndReply = useCallback(
    async (audioBlob: Blob) => {
      if (stoppedRef.current) return;
      // Guard tiny / empty blobs — they trigger CF "Failed to decode" 3030
      // and Next.js "Failed to parse FormData" 400. ~1 KB is the minimum
      // a webm/opus header + a few frames of audio comes out to.
      if (audioBlob.size < 1024) {
        setPhase("listening");
        return;
      }
      setPhase("transcribing");
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "utterance.webm");
        formData.append("language", languageRef?.current ?? "en-US");
        const res = await fetch("/api/voice/transcribe", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          console.warn("[live] transcribe http error:", res.status, err);
          if (res.status === 429) showQuotaToast(err);
          setPhase("listening");
          return;
        }
        const { text } = (await res.json()) as { text: string };
        if (!text.trim()) {
          setPhase("listening");
          return;
        }
        setUserTranscript(text);
        setTranscripts((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: "user", content: text, ts: Date.now() },
        ]);
        await sendTranscript(text);
      } catch (err) {
        console.error("[live] transcribe failed:", err);
        toast.error("Couldn't hear that — try again.");
        setPhase("listening");
      }
    },
    [sendTranscript, languageRef]
  );

  // ─── Mic capture lifecycle ────────────────────────────────────────────

  // Build a fresh MediaRecorder bound to the current stream. We create one
  // per utterance because reusing the same instance after stop()→start()
  // produces blobs without the WebM EBML init segment, which Cloudflare
  // Whisper rejects with "Failed to decode audio file" (code 3030).
  const buildRecorder = useCallback((stream: MediaStream): MediaRecorder | null => {
    if (!stream.active) {
      console.warn("[live] buildRecorder: stream is not active, skipping");
      return null;
    }

    // Build an audio-ONLY MediaStream for the recorder. When camera is on,
    // the parent stream contains both audio + video tracks; passing both to
    // MediaRecorder with an audio/* mimeType throws "NotSupportedError" on
    // most Chromium builds. We share the underlying audio MediaStreamTrack
    // with the analyser (no clone), so VAD + recording stay in sync.
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn("[live] buildRecorder: no audio tracks on stream");
      return null;
    }
    const audioOnly = new MediaStream(audioTracks);

    // Detect the first codec the browser actually supports. Older Safari
    // versions throw NotSupportedError if you pass any options object with
    // an unsupported mimeType, so we prefer "no options" over "guess".
    let mimeType = "";
    try {
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }
    } catch { /* isTypeSupported can throw on locked-down browsers */ }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(audioOnly, mimeType ? { mimeType } : undefined);
    } catch (err) {
      console.error("[live] MediaRecorder ctor failed:", err);
      return null;
    }
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    return recorder;
  }, []);

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
    // the chunks in onstop so we can package them and spin up a fresh
    // recorder for the next utterance.
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
      const stream = streamRef.current;
      if (stream && stream.active && !stoppedRef.current) {
        const next = buildRecorder(stream);
        recorderRef.current = next;
        if (next) {
          try {
            // No timeslice — let stop() flush one self-contained WebM blob.
            // With timeslice the trailing cluster gets truncated on stop()
            // and both Whisper + Sarvam reject the file as malformed.
            next.start();
            recorderStartedAtRef.current = Date.now();
          } catch (err) {
            console.warn("[live] recorder.start failed:", err);
          }
        }
      }
    };
    try {
      recorder.stop();
    } catch (err) {
      console.warn("[live] recorder.stop failed:", err);
    }
  }, [transcribeAndReply, buildRecorder]);

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

    if (ttsActiveRef.current) {
      // ─── Barge-in: AI is speaking, listen for user interruption ─────
      // Threshold is raised because echoCancellation leaves a ~10-15
      // residue on the analyser. We want to trip on genuine user speech
      // only — typically 35-60 range, well above echo residue.
      if (avg > VAD_BARGE_IN_THRESHOLD) {
        if (bargeInStartRef.current === 0) {
          bargeInStartRef.current = Date.now();
        } else if (Date.now() - bargeInStartRef.current > BARGE_IN_HOLD_MS) {
          // Sustained user speech → kill the AI's reply mid-sentence.
          // interrupt() cancels audio + clears queue + aborts orchestrate.
          bargeInStartRef.current = 0;
          interruptRef.current();
        }
      } else {
        // Speech dropped back below threshold — reset the hold timer.
        bargeInStartRef.current = 0;
      }
    } else {
      // ─── Normal VAD: user can speak freely ──────────────────────────
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
          // Don't finalize while the recorder is still emitting its first
          // chunk (which contains the WebM EBML init segment). Without
          // that header Cloudflare Whisper returns code 3030.
          const recorderAge = Date.now() - (recorderStartedAtRef.current || 0);
          if (recorderAge >= MIN_RECORDER_UPTIME_MS) {
            finalizeUtterance();
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [finalizeUtterance]);

  // ─── Start / stop session ─────────────────────────────────────────────
  const start = useCallback(async () => {
    stoppedRef.current = false;
    try {
      // Constraints tuned for voice-grade audio + cheap face-detection video.
      // sampleRate is a hint only — Chrome may ignore it but stating 44100
      // avoids "NotSupportedError" on some Windows audio drivers that
      // default to weird rates (96 kHz, 192 kHz, etc.).
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
        },
        video: cameraEnabled
          ? { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } }
          : false,
      });
      // Browser can hand us a stream that's "inactive" if the user revoked
      // permission between the prompt and the resolve — abort cleanly.
      if (!stream.active || stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
        throw new Error("Microphone stream is not active");
      }
      streamRef.current = stream;
      // If video tracks exist, surface them so the face hook can attach.
      if (stream.getVideoTracks().length > 0) {
        setVideoStream(stream);
      } else {
        setVideoStream(null);
      }

      const Ctor = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
      const ctx = new Ctor();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      // First recorder. finalizeUtterance overwrites onstop and swaps in a
      // fresh recorder per utterance (see buildRecorder for why).
      const recorder = buildRecorder(stream);
      if (!recorder) {
        throw new Error("MediaRecorder unavailable in this browser");
      }
      recorder.onstop = () => {};
      recorderRef.current = recorder;
      try {
        recorder.start(); // no timeslice — single self-contained blob on stop()
        recorderStartedAtRef.current = Date.now();
      } catch (err) {
        throw new Error(`MediaRecorder.start failed: ${(err as Error)?.message ?? err}`);
      }

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
  }, [tick, buildRecorder, cameraEnabled]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (rafRef.current !== null) {
      try { cancelAnimationFrame(rafRef.current); } catch { /* ignore */ }
    }
    rafRef.current = null;

    if (recorderRef.current) {
      try {
        if (recorderRef.current.state !== "inactive") recorderRef.current.stop();
      } catch { /* not recording */ }
    }
    recorderRef.current = null;

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch { /* track already stopped */ }
        });
      } catch { /* stream torn down */ }
    }
    streamRef.current = null;
    setVideoStream(null);

    if (audioCtxRef.current) {
      try {
        // close() rejects if context is already closed — swallow.
        audioCtxRef.current.close().catch(() => {});
      } catch { /* ignore */ }
    }
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

  // Wire the interrupt ref so the VAD tick can call it without taking
  // interrupt as a useCallback dep (would cause re-creation cascade).
  useEffect(() => {
    interruptRef.current = interrupt;
  }, [interrupt]);

  // Auto-start on mount, full cleanup on unmount.
  useEffect(() => {
    void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Direct TTS + transcript push. Used for the persona opening line so the
  // AI greets the user without paying a round-trip orchestrate latency.
  const speakLine = useCallback(
    (text: string) => {
      if (!text.trim() || stoppedRef.current) return;
      setTranscripts((prev) => [
        ...prev,
        { id: `ai-greet-${Date.now()}`, role: "ai", content: text, ts: Date.now() },
      ]);
      void enqueueTts(text);
    },
    [enqueueTts]
  );

  // Replace the in-memory transcript history with a server-restored set.
  // Idempotent: same turns called twice = same final state. ResumeManager
  // uses this on reconnect / page reload.
  const restoreTranscripts = useCallback((turns: TranscriptTurn[]) => {
    setTranscripts((prev) => {
      // Don't clobber an active session — only restore when the local
      // history is empty (fresh page load / reconnect with no new turns).
      if (prev.length > 0) return prev;
      return turns;
    });
  }, []);

  return {
    phase,
    isStreaming: phase !== "idle",
    isModelSpeaking: phase === "speaking",
    audioLevel,
    outputAudioLevel,
    userTranscript,
    aiResponse,
    transcripts,
    videoStream,
    interrupt,
    speakLine,
    restoreTranscripts,
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
  // Face detection toggle. Default: on for Pro (which is the only tier that
  // can reach this page anyway). Persisted to localStorage so the user's
  // privacy choice survives refresh.
  const [faceEnabled, setFaceEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("livetalk:face");
    return stored === null ? true : stored === "1";
  });

  // Latest expression — read by useLiveAudio when it sends an orchestrate call.
  const expressionRef = useRef<string>("neutral");

  // Active persona — read from Redux + mirrored into a ref so useLiveAudio's
  // sendTranscript closure always sees the current value without re-creating.
  const selectedPersona = useAppSelector((s) => s.persona.selected);
  const personaRef = useRef<string>(selectedPersona);
  useEffect(() => {
    personaRef.current = selectedPersona;
  }, [selectedPersona]);

  // Locale — full BCP-47 (e.g. "hi-IN") sent to the server, which routes
  // Sarvam vs Cloudflare per language. Mirrored into a ref so STT/TTS
  // closures see the latest value mid-session.
  const userLocale = useAppSelector((s) => s.locale);
  const languageRef = useRef<string>(userLocale.primaryLanguage);
  useEffect(() => {
    languageRef.current = userLocale.primaryLanguage;
  }, [userLocale.primaryLanguage]);

  // Voice style — same ref-mirroring pattern. Server resolves the style ID
  // ("warm_female") to a Sarvam speaker ("meera") per language.
  const voiceState = useAppSelector((s) => s.voice);
  const voiceStyleRef = useRef<string>(voiceState.style);
  useEffect(() => {
    voiceStyleRef.current = voiceState.style;
  }, [voiceState.style]);

  // Trigger lazy-load of locale + voice into Redux on first mount.
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (userLocale.status === "idle") void dispatch(loadLocale());
  }, [userLocale.status, dispatch]);
  useEffect(() => {
    if (voiceState.status === "idle") void dispatch(loadVoice());
  }, [voiceState.status, dispatch]);

  // First-visit onboarding wizard. Shows when:
  //   - localStorage doesn't have the "onboarded" flag (so a returning user
  //     who already set things up isn't pestered)
  //   - AND we're not still loading the locale (avoid race: wizard pops with
  //     stale defaults, user picks something, locale loads and overrides)
  const [wizardOpen, setWizardOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (userLocale.status !== "ready") return;
    const onboarded = window.localStorage.getItem("livetalk:onboarded");
    if (!onboarded) setWizardOpen(true);
  }, [userLocale.status]);

  const {
    phase,
    isModelSpeaking,
    audioLevel,
    outputAudioLevel,
    userTranscript,
    aiResponse,
    transcripts,
    videoStream,
    interrupt,
    speakLine,
    restoreTranscripts,
    stop,
  } = useLiveAudio({
    cameraEnabled: faceEnabled,
    expressionRef,
    personaRef,
    languageRef,
    voiceStyleRef,
  });

  // Network state — flips overlay between online / reconnecting / offline.
  // Heartbeat ping every 15s; OS events flip instantly.
  const network = useNetworkState(true);

  // ─── Opening greeting ────────────────────────────────────────────────
  // When the session is ready (mic flowing, wizard closed, no prior turns)
  // we greet the user in-character. Uses speakLine — direct TTS, no
  // /api/orchestrate round-trip → user hears the greeting in ~1s.
  const greetedRef = useRef(false);
  useEffect(() => {
    if (greetedRef.current) return;
    if (wizardOpen) return;
    if (phase !== "listening") return;
    if (transcripts.length > 0) return; // user already mid-conversation (e.g. reconnect)
    const card = PERSONAS[selectedPersona];
    if (!card?.openingLine) return;
    greetedRef.current = true;
    speakLine(card.openingLine);
  }, [phase, wizardOpen, transcripts.length, selectedPersona, speakLine]);

  const face = useFaceLandmarks({
    enabled: faceEnabled && !!videoStream,
    videoStream,
  });

  // Keep our local ref in sync with the smoothed value from the face hook.
  useEffect(() => {
    expressionRef.current = face.expression;
  }, [face.expression]);

  const handleToggleFace = (next: boolean) => {
    setFaceEnabled(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("livetalk:face", next ? "1" : "0");
    }
  };

  return (
    <>
      {/* Hidden video element — MediaPipe reads frames from this. Mounted
          only when face detection is on so we don't keep a video track open
          unnecessarily. */}
      {faceEnabled && (
        <video
          ref={face.videoRef as React.RefObject<HTMLVideoElement>}
          autoPlay
          muted
          playsInline
          className="absolute -left-[9999px] size-px opacity-0 pointer-events-none"
        />
      )}

      <MeetView
        persona={selectedPersona}
        phase={phase}
        isModelSpeaking={isModelSpeaking}
        audioLevel={audioLevel}
        outputAudioLevel={outputAudioLevel}
        expression={face.expression}
        videoStream={videoStream}
        userTranscript={userTranscript}
        aiResponse={aiResponse}
        transcripts={transcripts}
        cameraEnabled={faceEnabled}
        onToggleCamera={handleToggleFace}
        onReconfigure={() => setWizardOpen(true)}
        onClose={() => {
          stop();
          onClose();
        }}
        onInterrupt={interrupt}
      />

      <OnboardingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {/* Hydrates Redux (persona/locale/voice) + transcripts on mount.
          Runs ONCE per session — internal ref prevents re-fetching. */}
      <ResumeManager onRestoreTurns={restoreTranscripts} />

      {/* Non-blocking banner while network is degraded. */}
      <ReconnectOverlay
        state={network.state}
        lastOnlineAt={network.lastOnlineAt}
        onRetry={network.retry}
      />
    </>
  );
}
