"use client";

import { useRef, useCallback } from "react";

const MIN_UTTERANCE_MS = 700;

interface UseMediaCaptureParams {
  streamRef: React.MutableRefObject<MediaStream | null>;
  stoppedRef: React.MutableRefObject<boolean>;
  micMutedRef: React.MutableRefObject<boolean>;
  onBlobReadyRef: React.MutableRefObject<(blob: Blob) => void>;
  // Shared VAD refs
  speakingRef: React.MutableRefObject<boolean>;
  silenceStartRef: React.MutableRefObject<number>;
  captureStartedAtRef: React.MutableRefObject<number>;
  recorderStartedAtRef: React.MutableRefObject<number>;
  setPhase: React.Dispatch<React.SetStateAction<string>>;
  recorderRef: React.MutableRefObject<MediaRecorder | null>;
  recordedChunksRef: React.MutableRefObject<Blob[]>;
}

export function useMediaCapture(params: UseMediaCaptureParams) {
  const {
    streamRef,
    stoppedRef,
    micMutedRef,
    onBlobReadyRef,
    speakingRef,
    silenceStartRef,
    captureStartedAtRef,
    recorderStartedAtRef,
    setPhase,
    recorderRef,
    recordedChunksRef,
  } = params;

  const buildRecorder = useCallback((stream: MediaStream): MediaRecorder | null => {
    if (!stream.active) {
      console.warn("[live] buildRecorder: stream is not active, skipping");
      return null;
    }
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn("[live] buildRecorder: no audio tracks on stream");
      return null;
    }
    const audioOnly = new MediaStream(audioTracks);

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
  }, [recordedChunksRef]);

  const finalizeUtterance = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state !== "recording") return;
    const startedAt = captureStartedAtRef.current;
    captureStartedAtRef.current = 0;
    speakingRef.current = false;
    silenceStartRef.current = 0;

    recorder.onstop = () => {
      const dur = startedAt ? Date.now() - startedAt : 0;
      const chunks = recordedChunksRef.current;
      recordedChunksRef.current = [];
      if (micMutedRef.current) {
        setPhase("listening");
      } else if (dur >= MIN_UTTERANCE_MS && chunks.length) {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        onBlobReadyRef.current(blob);
      } else {
        setPhase("listening");
      }
      const stream = streamRef.current;
      if (stream && stream.active && !stoppedRef.current) {
        const next = buildRecorder(stream);
        recorderRef.current = next;
        if (next) {
          try {
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
  }, [
    recorderRef, recordedChunksRef, streamRef, stoppedRef,
    micMutedRef, speakingRef, silenceStartRef, captureStartedAtRef,
    recorderStartedAtRef, buildRecorder, onBlobReadyRef, setPhase,
  ]);

  const cleanupCapture = useCallback(() => {
    if (recorderRef.current) {
      try {
        if (recorderRef.current.state !== "inactive") recorderRef.current.stop();
      } catch { /* ignore */ }
    }
    recorderRef.current = null;
    recordedChunksRef.current = [];
  }, [recorderRef, recordedChunksRef]);

  return { buildRecorder, finalizeUtterance, cleanupCapture };
}
