"use client";

import { useRef, useCallback, useState } from "react";

export const VAD_SPEECH_THRESHOLD = 22;
export const VAD_BARGE_IN_THRESHOLD = 36;
export const BARGE_IN_HOLD_MS = 250;
export const VAD_SILENCE_DURATION_MS = 1200;

export interface VADCallbacks {
  onSpeechEnd?: () => void;
  onBargeIn?: () => void;
}

interface UseVADParams {
  analyserRef: React.RefObject<AnalyserNode | null>;
  ttsActiveRef: React.MutableRefObject<boolean>;
  micMutedRef: React.MutableRefObject<boolean>;
  speakingRef: React.MutableRefObject<boolean>;
  silenceStartRef: React.MutableRefObject<number>;
  captureStartedAtRef: React.MutableRefObject<number>;
  recorderStartedAtRef: React.MutableRefObject<number>;
  callbacksRef: React.MutableRefObject<VADCallbacks>;
}

export function useVAD(params: UseVADParams) {
  const {
    analyserRef,
    ttsActiveRef,
    micMutedRef,
    speakingRef,
    silenceStartRef,
    captureStartedAtRef,
    recorderStartedAtRef,
    callbacksRef,
  } = params;

  const [audioLevel, setAudioLevel] = useState(0);
  const rafRef = useRef<number | null>(null);
  const bargeInStartRef = useRef(0);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const bins = analyser.frequencyBinCount;
    const data = new Uint8Array(bins);
    analyser.getByteFrequencyData(data);

    let sum = 0;
    for (let i = 0; i < bins; i++) sum += data[i];
    const avg = sum / bins;
    setAudioLevel(Math.min(100, (avg / 128) * 100));

    // Mic mute gate
    if (micMutedRef.current) {
      setAudioLevel(0);
      speakingRef.current = false;
      captureStartedAtRef.current = 0;
      silenceStartRef.current = 0;
      bargeInStartRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    if (ttsActiveRef.current) {
      // Barge-in: higher threshold while AI speaks
      if (avg > VAD_BARGE_IN_THRESHOLD) {
        if (bargeInStartRef.current === 0) {
          bargeInStartRef.current = Date.now();
        } else if (Date.now() - bargeInStartRef.current > BARGE_IN_HOLD_MS) {
          bargeInStartRef.current = 0;
          callbacksRef.current.onBargeIn?.();
        }
      } else {
        bargeInStartRef.current = 0;
      }
    } else {
      // Normal VAD
      if (avg > VAD_SPEECH_THRESHOLD) {
        if (!speakingRef.current) {
          speakingRef.current = true;
          captureStartedAtRef.current = Date.now();
        }
        silenceStartRef.current = 0;
      } else if (speakingRef.current) {
        if (silenceStartRef.current === 0) {
          silenceStartRef.current = Date.now();
        } else if (Date.now() - silenceStartRef.current > VAD_SILENCE_DURATION_MS) {
          const recorderAge = Date.now() - recorderStartedAtRef.current;
          if (recorderAge >= 300) {
            callbacksRef.current.onSpeechEnd?.();
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [
    analyserRef, ttsActiveRef, micMutedRef,
    speakingRef, silenceStartRef, captureStartedAtRef,
    recorderStartedAtRef, callbacksRef,
  ]);

  const startTick = useCallback(() => {
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopTick = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const resetVad = useCallback(() => {
    speakingRef.current = false;
    silenceStartRef.current = 0;
    captureStartedAtRef.current = 0;
    bargeInStartRef.current = 0;
  }, [speakingRef, silenceStartRef, captureStartedAtRef]);

  return { audioLevel, startTick, stopTick, resetVad, rafRef };
}
