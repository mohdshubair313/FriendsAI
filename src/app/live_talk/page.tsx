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
import { useVAD, type VADCallbacks } from "@/lib/hooks/useVAD";
import { useTTSQueue } from "@/lib/hooks/useTTSQueue";
import { useMediaCapture } from "@/lib/hooks/useMediaCapture";
import { useOrchestrateStream } from "@/lib/hooks/useOrchestrateStream";
import { PERSONAS } from "@/lib/chat/personas";
import { useFaceLandmarks } from "@/lib/face/useFaceLandmarks";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

type VoicePhase = "idle" | "listening" | "transcribing" | "thinking" | "speaking";

export interface TranscriptTurn {
  id: string;
  role: "user" | "ai";
  content: string;
  ts: number;
}

interface UseLiveAudioOptions {
  cameraEnabled: boolean;
  expressionRef?: React.RefObject<string>;
  personaRef?: React.RefObject<string>;
  languageRef?: React.RefObject<string>;
  voiceStyleRef?: React.RefObject<string>;
}

function useLiveAudio({
  cameraEnabled,
  expressionRef,
  personaRef,
  languageRef,
  voiceStyleRef,
}: UseLiveAudioOptions) {
  // ── Public state ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([]);
  const transcriptsRef = useRef<TranscriptTurn[]>([]);
  useEffect(() => { transcriptsRef.current = transcripts; }, [transcripts]);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const micMutedRef = useRef(false);
  useEffect(() => { micMutedRef.current = micMuted; }, [micMuted]);

  // ── Shared refs (owned by orchestrator, passed to sub-hooks) ────────────
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const stoppedRef = useRef(false);
  const ttsActiveRef = useRef(false);

  // VAD shared refs (read+written by VAD tick, read by media capture)
  const speakingRef = useRef(false);
  const silenceStartRef = useRef(0);
  const captureStartedAtRef = useRef(0);
  const recorderStartedAtRef = useRef(0);
  const bargeInStartRef = useRef(0);

  // Media capture refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // ── Callback refs for cross-hook wiring ────────────────────────────────
  const vadCallbacksRef = useRef<VADCallbacks>({});
  const blobReadyRef = useRef<(blob: Blob) => void>(() => {});
  const orchCallbacksRef = useRef<{ onToken?: (chunk: string) => void; onDone?: () => void }>({});

  // ── Sub-hooks ──────────────────────────────────────────────────────────
  const vad = useVAD({
    analyserRef,
    ttsActiveRef,
    micMutedRef,
    speakingRef,
    silenceStartRef,
    captureStartedAtRef,
    recorderStartedAtRef,
    callbacksRef: vadCallbacksRef,
  });

  const media = useMediaCapture({
    streamRef,
    stoppedRef,
    micMutedRef,
    onBlobReadyRef: blobReadyRef,
    speakingRef,
    silenceStartRef,
    captureStartedAtRef,
    recorderStartedAtRef,
    setPhase: setPhase as React.Dispatch<React.SetStateAction<string>>,
    recorderRef,
    recordedChunksRef,
  });

  const tts = useTTSQueue({
    languageRef,
    voiceStyleRef,
    personaRef,
    stoppedRef,
    setPhase: setPhase as React.Dispatch<React.SetStateAction<string>>,
    setOutputAudioLevel,
    setAiResponse,
  });

  const orch = useOrchestrateStream({
    expressionRef,
    personaRef,
    voiceStyleRef,
    languageRef,
    stoppedRef,
    transcriptsRef,
    callbacksRef: orchCallbacksRef,
    setPhase: setPhase as React.Dispatch<React.SetStateAction<string>>,
    setAiResponse,
    setTranscripts,
  });

  // ── Wire cross-hook callbacks (stable, runs once) ──────────────────────
  useEffect(() => {
    vadCallbacksRef.current = {
      onSpeechEnd: () => media.finalizeUtterance(),
      onBargeIn: interrupt,
    };
    blobReadyRef.current = (blob) => transcribeAndReply(blob);
    orchCallbacksRef.current = {
      onToken: (chunk) => tts.onChatToken(chunk),
      onDone: () => tts.flushTtsBuffer(),
    };
  });

  // ── Transcribe + orchestrate ───────────────────────────────────────────
  const transcribeAndReply = useCallback(
    async (audioBlob: Blob) => {
      if (stoppedRef.current) return;
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
        await orch.sendTranscript(text);
      } catch (err) {
        console.error("[live] transcribe failed:", err);
        toast.error("Couldn't hear that — try again.");
        setPhase("listening");
      }
    },
    [languageRef, orch.sendTranscript]
  );

  // ── Interrupt ──────────────────────────────────────────────────────────
  const interrupt = useCallback(async () => {
    tts.interruptTts();
    orch.abortStream();
    setPhase("listening");
    try {
      await fetch("/api/voice/interrupt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: orch.conversationIdRef.current ?? "live" }),
      });
    } catch { /* best-effort */ }
  }, [tts.interruptTts, orch.abortStream, orch.conversationIdRef]);

  // ── Start / stop session ───────────────────────────────────────────────
  const start = useCallback(async () => {
    stoppedRef.current = false;
    try {
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
      if (!stream.active || stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
        throw new Error("Microphone stream is not active");
      }
      streamRef.current = stream;
      setVideoStream(stream.getVideoTracks().length > 0 ? stream : null);

      const Ctor = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
      const ctx = new Ctor();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const recorder = media.buildRecorder(stream);
      if (!recorder) throw new Error("MediaRecorder unavailable in this browser");
      recorder.onstop = () => {};
      recorderRef.current = recorder;
      try {
        recorder.start();
        recorderStartedAtRef.current = Date.now();
      } catch (err) {
        throw new Error(`MediaRecorder.start failed: ${(err as Error)?.message ?? err}`);
      }

      setPhase("listening");
      vad.startTick();
    } catch (err) {
      console.error("[live] mic start failed:", err);
      toast.error(
        (err as { name?: string })?.name === "NotAllowedError"
          ? "Microphone permission denied."
          : "Couldn't access your microphone."
      );
      setPhase("idle");
    }
  }, [cameraEnabled, vad.startTick, media.buildRecorder]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    vad.stopTick();
    media.cleanupCapture();
    tts.cleanupTts();
    orch.cleanupOrch();

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
      try { audioCtxRef.current.close().catch(() => {}); } catch { /* ignore */ }
    }
    audioCtxRef.current = null;
    analyserRef.current = null;

    speakingRef.current = false;
    silenceStartRef.current = 0;
    captureStartedAtRef.current = 0;

    setPhase("idle");
    setOutputAudioLevel(0);
  }, [vad.stopTick, media.cleanupCapture, tts.cleanupTts, orch.cleanupOrch]);

  // Auto-start on mount
  useEffect(() => {
    void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── speakLine / restoreTranscripts / toggleMic ─────────────────────────
  const speakLine = useCallback(
    (text: string) => {
      if (!text.trim() || stoppedRef.current) return;
      setTranscripts((prev) => [
        ...prev,
        { id: `ai-greet-${Date.now()}`, role: "ai", content: text, ts: Date.now() },
      ]);
      void tts.enqueueTts(text);
    },
    [tts.enqueueTts]
  );

  const restoreTranscripts = useCallback((turns: TranscriptTurn[]) => {
    setTranscripts((prev) => {
      if (prev.length > 0) return prev;
      return turns;
    });
  }, []);

  const toggleMic = useCallback(() => {
    setMicMuted((prev) => {
      const next = !prev;
      if (next && ttsActiveRef.current) void interrupt();
      return next;
    });
  }, [interrupt, ttsActiveRef]);

  // Audio level from VAD sub-hook (state is managed inside useVAD)

  return {
    phase,
    isStreaming: phase !== "idle",
    isModelSpeaking: phase === "speaking",
    audioLevel: vad.audioLevel,
    outputAudioLevel,
    userTranscript,
    aiResponse,
    transcripts,
    videoStream,
    micMuted,
    toggleMic,
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
  const [faceEnabled, setFaceEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("livetalk:face");
    return stored === null ? true : stored === "1";
  });

  const expressionRef = useRef<string>("neutral");

  const selectedPersona = useAppSelector((s) => s.persona.selected);
  const personaRef = useRef<string>(selectedPersona);
  useEffect(() => { personaRef.current = selectedPersona; }, [selectedPersona]);

  const userLocale = useAppSelector((s) => s.locale);
  const languageRef = useRef<string>(userLocale.primaryLanguage);
  useEffect(() => { languageRef.current = userLocale.primaryLanguage; }, [userLocale.primaryLanguage]);

  const voiceState = useAppSelector((s) => s.voice);
  const voiceStyleRef = useRef<string>(voiceState.style);
  useEffect(() => { voiceStyleRef.current = voiceState.style; }, [voiceState.style]);

  const dispatch = useAppDispatch();
  useEffect(() => { if (userLocale.status === "idle") void dispatch(loadLocale()); }, [userLocale.status, dispatch]);
  useEffect(() => { if (voiceState.status === "idle") void dispatch(loadVoice()); }, [voiceState.status, dispatch]);

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
    micMuted,
    toggleMic,
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

  const network = useNetworkState(true);

  const greetedRef = useRef(false);
  useEffect(() => {
    if (greetedRef.current) return;
    if (wizardOpen) return;
    if (phase !== "listening") return;
    if (transcripts.length > 0) return;
    const card = PERSONAS[selectedPersona];
    if (!card?.openingLine) return;
    greetedRef.current = true;
    speakLine(card.openingLine);
  }, [phase, wizardOpen, transcripts.length, selectedPersona, speakLine]);

  const face = useFaceLandmarks({
    enabled: faceEnabled && !!videoStream,
    videoStream,
  });

  useEffect(() => { expressionRef.current = face.expression; }, [face.expression]);

  const handleToggleFace = (next: boolean) => {
    setFaceEnabled(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("livetalk:face", next ? "1" : "0");
    }
  };

  return (
    <>
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
        micMuted={micMuted}
        onToggleMic={toggleMic}
        onReconfigure={() => setWizardOpen(true)}
        onClose={() => { stop(); onClose(); }}
        onInterrupt={interrupt}
      />

      <OnboardingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <ResumeManager onRestoreTurns={restoreTranscripts} />
      <ReconnectOverlay
        state={network.state}
        lastOnlineAt={network.lastOnlineAt}
        onRetry={network.retry}
      />
    </>
  );
}
