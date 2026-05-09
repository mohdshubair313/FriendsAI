"use client";

import { useEffect, useRef, useState } from "react";
import {
  classifyFrame,
  detectNod,
  ExpressionSmoother,
  type Blendshape,
  type Expression,
  type HeadPoseSample,
} from "./expressionMapper";

// MediaPipe model artefacts. Hosted by Google's CDN — they cache to IndexedDB
// after first load (~3 MB), so subsequent visits are near-instant.
const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const POLL_INTERVAL_MS = 200; // 5 Hz — face doesn't change faster than this

interface UseFaceLandmarksOptions {
  /** When false, the hook tears down (saves CPU + camera light). */
  enabled: boolean;
  /** A live MediaStream that includes a video track. */
  videoStream: MediaStream | null;
}

interface UseFaceLandmarksReturn {
  /** Latest expression label. Polled value, also exposed via ref. */
  expression: Expression;
  /** Ref form for code paths that don't want to re-render on every change. */
  expressionRef: React.MutableRefObject<Expression>;
  /** True after the model has loaded and at least one inference ran. */
  ready: boolean;
  /** Last initialization error, if any. */
  error: string | null;
  /** Hidden video element to mount in JSX (autoplay, muted, playsInline). */
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * Detects user facial expressions in real time via MediaPipe FaceLandmarker.
 *
 * Lifecycle:
 *   - On `enabled` true + a non-null videoStream: lazy-loads the WASM bundle
 *     and the model, attaches the stream to a hidden <video>, polls at 5 Hz.
 *   - On `enabled` false (or unmount / stream change): closes the landmarker
 *     and stops polling. The video element is left mounted so re-enabling is
 *     instant.
 *
 * Privacy: only the derived enum label leaves this hook. No frames are sent
 * to a server.
 */
export function useFaceLandmarks({
  enabled,
  videoStream,
}: UseFaceLandmarksOptions): UseFaceLandmarksReturn {
  const [expression, setExpression] = useState<Expression>("neutral");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expressionRef = useRef<Expression>("neutral");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Long-lived refs to MediaPipe primitives + RAF loop state.
  // We type the landmarker as `unknown` here because @mediapipe/tasks-vision
  // isn't in the type bundle until first dynamic import resolves.
  const landmarkerRef = useRef<unknown>(null);
  const intervalRef = useRef<number | null>(null);
  const smootherRef = useRef(new ExpressionSmoother(5));
  const headPoseRef = useRef<HeadPoseSample[]>([]);
  const stoppedRef = useRef(false);

  // Attach stream to <video> whenever the stream identity changes.
  // Guard every step — the <video> element may not be mounted yet on the
  // first render, and the stream's tracks may have been stopped by the
  // parent in between renders.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (videoStream && videoStream.active && videoStream.getVideoTracks().length > 0) {
        v.srcObject = videoStream;
        // play() rejects on autoplay-policy violations; swallow harmlessly.
        const playPromise = v.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch(() => {/* user-gesture required edge case */});
        }
      } else {
        v.srcObject = null;
      }
    } catch (err) {
      console.warn("[useFaceLandmarks] attach stream failed:", err);
    }
  }, [videoStream]);

  // Initialise + tear down MediaPipe based on `enabled` flag.
  useEffect(() => {
    if (!enabled || !videoStream) {
      // Disabled: tear down any existing landmarker.
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      smootherRef.current.reset();
      headPoseRef.current = [];
      setReady(false);
      // We deliberately don't close() the landmarker here — re-enabling
      // immediately after toggling off would have to reload the WASM.
      // Memory cost of keeping it warm is small.
      return;
    }

    stoppedRef.current = false;

    (async () => {
      try {
        // Lazy import — keeps MediaPipe out of the chat bundle.
        const vision = await import("@mediapipe/tasks-vision");
        const { FilesetResolver, FaceLandmarker } = vision;

        if (stoppedRef.current) return;

        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE);
        if (stoppedRef.current) return;

        // CPU delegate, not GPU. Reasons:
        //   1. We're polling at 5 Hz — XNNPACK on CPU finishes a single
        //      face in ~10-15ms, well within budget.
        //   2. The GPU delegate spins up its own WebGL context. Combined
        //      with R3F's Canvas (avatar mode), Windows browsers blow
        //      past the per-tab WebGL context limit (~8-16) and the
        //      whole pipeline starts losing contexts.
        // Switching to CPU made the recurring "Context Lost" disappear.
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (stoppedRef.current) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;

        // Polling loop — pulls a frame from the <video> at 5 Hz and classifies.
        intervalRef.current = window.setInterval(() => {
          // Triple-guard: hook torn down between ticks, video element
          // unmounted, or video not yet decoded a frame.
          if (stoppedRef.current) return;
          const v = videoRef.current;
          if (!v || v.readyState < 2) return; // HAVE_CURRENT_DATA
          if (!landmarkerRef.current) return;

          let result;
          try {
            result = landmarker.detectForVideo(v, performance.now());
          } catch (err) {
            // MediaPipe sometimes throws on torn-down video / GPU loss.
            // Swallow — next tick may succeed; full failure is rare enough
            // not to require teardown here.
            console.warn("[useFaceLandmarks] detect threw, skipping frame:", err);
            return;
          }
          const shapes = result?.faceBlendshapes?.[0]?.categories as
            | Blendshape[]
            | undefined;

          if (!shapes || shapes.length === 0) return;

          // Pitch from the 4×4 transformation matrix (column-major).
          // Element [9] (matrix[2][1]) ≈ sin(pitch). Good enough for a
          // ±10° nod-detection threshold.
          const matrix = result?.facialTransformationMatrixes?.[0]?.data as
            | number[]
            | undefined;
          if (matrix && matrix.length >= 16) {
            const pitchRad = Math.asin(Math.max(-1, Math.min(1, matrix[9])));
            const pitchDeg = (pitchRad * 180) / Math.PI;
            headPoseRef.current.push({ pitch: pitchDeg, t: performance.now() });
            if (headPoseRef.current.length > 30) headPoseRef.current.shift();
          }

          let label = classifyFrame(shapes);
          // Nodding overrides if the recent head trace shows oscillation.
          if (label === "neutral" && detectNod(headPoseRef.current)) {
            label = "neutral"; // stays neutral but we surface "nodding" via smoother
            const smoothed = smootherRef.current.push("nodding");
            expressionRef.current = smoothed;
            setExpression(smoothed);
            setReady(true);
            return;
          }

          const smoothed = smootherRef.current.push(label);
          if (smoothed !== expressionRef.current) {
            expressionRef.current = smoothed;
            setExpression(smoothed);
          }
          setReady(true);
        }, POLL_INTERVAL_MS);

        setError(null);
      } catch (err) {
        console.error("[useFaceLandmarks] init failed:", err);
        setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      stoppedRef.current = true;
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const lm = landmarkerRef.current as { close?: () => void } | null;
      if (lm && typeof lm.close === "function") {
        try { lm.close(); } catch { /* ignore */ }
      }
      landmarkerRef.current = null;
      smootherRef.current.reset();
      headPoseRef.current = [];
    };
  }, [enabled, videoStream]);

  return { expression, expressionRef, ready, error, videoRef };
}
