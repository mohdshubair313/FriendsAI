"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import type { Expression, PersonaGlow } from "@/components/chatComponents/LiveTalkOverlay";
import AvatarErrorBoundary from "./AvatarErrorBoundary";

/**
 * AvatarRenderer — a Three.js / R3F driven Ready Player Me avatar.
 *
 * Animation comes from three signals threaded down via props:
 *   - audioLevel (0-100) → mouthOpen / jawOpen morph (lip-sync proxy)
 *   - expression          → eyebrow + mouth corners (mirrors user)
 *   - personaGlow         → resting smile baseline (Comedian smiles a bit)
 *
 * We don't ship a real phoneme-to-viseme pipeline yet — that's avatar 2.0.
 * jawOpen driven by amplitude looks decent for short utterances and is what
 * 90% of "AI avatar" demos use anyway.
 *
 * Eye blinks are scheduled randomly every 3-6s — without them the avatar
 * looks creepy after a few seconds.
 */

// Default Ready Player Me public demo avatar. ?morphTargets=ARKit ensures
// the GLB ships with the standard ARKit blendshape names we look up below.
// Users can override via the `avatarUrl` prop in the future.
const DEFAULT_AVATAR_URL =
  "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit&textureAtlas=1024";

// Preload — the moment any AvatarRenderer mounts, kick off the fetch so
// the second mount (toggle off → on) is instant.
useGLTF.preload(DEFAULT_AVATAR_URL);

interface AvatarRendererProps {
  audioLevel: number;       // 0-100 — drives jawOpen
  speaking: boolean;        // when true, audioLevel matters; otherwise idle
  expression: Expression;   // mirrors the user's face
  personaGlow: PersonaGlow; // tints the lighting + resting smile
  avatarUrl?: string;
  /** Called once if the GLB fetch fails / GL context is lost. Parent can
   *  use this to flip stageMode back to sphere + show a toast. */
  onAvatarUnavailable?: () => void;
}

export default function AvatarRenderer({
  audioLevel,
  speaking,
  expression,
  personaGlow,
  avatarUrl = DEFAULT_AVATAR_URL,
  onAvatarUnavailable,
}: AvatarRendererProps) {
  // Track GL context loss so we can render a degraded fallback instead
  // of a black canvas (some Windows machines lose context under memory
  // pressure when switching tabs).
  const [contextLost, setContextLost] = useState(false);

  // Same look as sphere mode — no text label, no "Avatar unavailable" noise.
  // Parent gets notified via onAvatarUnavailable so it can persist the
  // sphere preference and stop trying to load the avatar.
  const fallbackUI = (
    <CssSphereFallback
      personaGlow={personaGlow}
      audioLevel={audioLevel}
      speaking={speaking}
    />
  );

  if (contextLost) return fallbackUI;

  return (
    <div className="relative size-full">
      <AvatarErrorBoundary fallback={fallbackUI} onError={onAvatarUnavailable}>
        <Canvas
          // Cap DPR at 1.5 (was 2). On Windows + iGPU, 2× × 4K canvas blows
          // VRAM and triggers context loss. 1.5 still looks crisp at typical
          // /live_talk frame size (~340-420px).
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.55, 0.8], fov: 28 }}
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
            // Don't refuse to start on weak iGPUs; we'd rather render
            // something than nothing.
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);

            // Survive GL context loss without taking down the page. The
            // browser will dispatch contextrestored once free again; we
            // remount the canvas by toggling state.
            const canvas = gl.domElement;
            if (!canvas) return;
            const onLost = (e: Event) => {
              e.preventDefault(); // tells browser we want it back
              console.warn("[AvatarRenderer] WebGL context lost");
              setContextLost(true);
            };
            const onRestored = () => {
              console.log("[AvatarRenderer] WebGL context restored");
              setContextLost(false);
            };
            canvas.addEventListener("webglcontextlost", onLost, false);
            canvas.addEventListener("webglcontextrestored", onRestored, false);
          }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[2, 3, 2]} intensity={1.1} color={glowToColor(personaGlow)} />
          <directionalLight position={[-2, 1, -1]} intensity={0.4} color={"#ffffff"} />

          <Suspense fallback={<LoadingSphere personaGlow={personaGlow} />}>
            <Avatar
              url={avatarUrl}
              audioLevel={audioLevel}
              speaking={speaking}
              expression={expression}
              personaGlow={personaGlow}
            />
            <Environment preset="studio" />
          </Suspense>

          <ContactShadows position={[0, 0.05, 0]} opacity={0.35} blur={2.5} scale={2} />
        </Canvas>
      </AvatarErrorBoundary>
    </div>
  );
}

// ─── Fallbacks ───────────────────────────────────────────────────────────────

/**
 * Rendered inside the Canvas while the GLB downloads — a slowly-spinning
 * tinted sphere keeps the stage from looking dead during the ~1-2s fetch.
 */
function LoadingSphere({ personaGlow }: { personaGlow: PersonaGlow }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={ref} position={[0, 1.55, 0]}>
      <sphereGeometry args={[0.18, 32, 32]} />
      <meshStandardMaterial
        color={glowToColor(personaGlow)}
        emissive={glowToColor(personaGlow)}
        emissiveIntensity={0.4}
        roughness={0.3}
      />
    </mesh>
  );
}

/**
 * Rendered OUTSIDE the Canvas when the avatar fails entirely (CDN down,
 * malformed GLB, GL context lost). Pure DOM, no WebGL — guaranteed to
 * render even when Three.js is broken. Matches the sphere-mode look so
 * the user sees a graceful continuation, not a broken-feature notice.
 */
function CssSphereFallback({
  personaGlow,
  audioLevel,
  speaking,
}: {
  personaGlow: PersonaGlow;
  audioLevel: number;
  speaking: boolean;
}) {
  const color = glowToColor(personaGlow);
  const scale = 1 + (audioLevel / 100) * 0.18;
  return (
    <div className="size-full flex items-center justify-center">
      <div
        className="relative size-72 transition-transform duration-200"
        style={{ transform: `scale(${scale})` }}
      >
        <div
          className="absolute -inset-12 rounded-full blur-3xl opacity-60"
          style={{ background: `radial-gradient(circle, ${color}88, transparent 70%)` }}
        />
        <div
          className="absolute inset-0 rounded-full overflow-hidden animate-spin"
          style={{
            animationDuration: speaking ? "6s" : "12s",
            background: `conic-gradient(from 0deg, ${color}, ${color}cc, ${color})`,
            filter: "blur(6px) saturate(1.4)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.45) 0%, transparent 55%)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Avatar mesh + animation loop ────────────────────────────────────────────

interface AvatarProps {
  url: string;
  audioLevel: number;
  speaking: boolean;
  expression: Expression;
  personaGlow: PersonaGlow;
}

type GLTFResult = GLTF & {
  scene: THREE.Group;
};

function Avatar({ url, audioLevel, speaking, expression, personaGlow }: AvatarProps) {
  const { scene } = useGLTF(url) as unknown as GLTFResult;

  // Find the head + teeth meshes — these own the morph targets we drive.
  // RPM bakes face blendshapes onto Wolf3D_Head + (sometimes) Wolf3D_Teeth.
  const morphMeshes = useMemo(() => {
    const meshes: THREE.SkinnedMesh[] = [];
    scene.traverse((obj) => {
      const m = obj as THREE.SkinnedMesh;
      if (m.isSkinnedMesh && m.morphTargetDictionary && m.morphTargetInfluences) {
        meshes.push(m);
      }
    });
    return meshes;
  }, [scene]);

  // Refs hold target values; useFrame lerps the actual influences toward them.
  const targetsRef = useRef<Record<string, number>>({});
  const blinkStateRef = useRef<{ nextBlinkAt: number; blinking: boolean; blinkStart: number }>({
    nextBlinkAt: performance.now() + 2000,
    blinking: false,
    blinkStart: 0,
  });

  // Recompute static-ish targets when expression / persona changes.
  useEffect(() => {
    targetsRef.current = computeTargets(expression, personaGlow);
  }, [expression, personaGlow]);

  useFrame((_, delta) => {
    if (morphMeshes.length === 0) return;

    // 1. JawOpen: driven by live audio amplitude when AI is speaking.
    //    Map 0-100 → 0-0.55 (full open looks goofy, cap at ~half).
    const jawTarget = speaking ? Math.min(0.55, (audioLevel / 100) * 0.55) : 0;

    // 2. Blinks — scheduled, not driven by inputs.
    const now = performance.now();
    const b = blinkStateRef.current;
    let blinkAmount = 0;
    if (!b.blinking && now >= b.nextBlinkAt) {
      b.blinking = true;
      b.blinkStart = now;
    }
    if (b.blinking) {
      // Blink animates over ~150ms: close (0-75ms) then open (75-150ms).
      const elapsed = now - b.blinkStart;
      if (elapsed >= 150) {
        b.blinking = false;
        b.nextBlinkAt = now + 3000 + Math.random() * 3000; // 3-6s gap
      } else if (elapsed < 75) {
        blinkAmount = elapsed / 75;
      } else {
        blinkAmount = 1 - (elapsed - 75) / 75;
      }
    }

    const desired: Record<string, number> = {
      ...targetsRef.current,
      jawOpen: jawTarget,
      eyeBlinkLeft: blinkAmount,
      eyeBlinkRight: blinkAmount,
    };

    // 3. Lerp every morph influence on every mesh toward its desired value.
    //    Lerp speed: jaw needs to be snappy (15/s), expressions are slower (5/s).
    for (const mesh of morphMeshes) {
      const dict = mesh.morphTargetDictionary!;
      const infls = mesh.morphTargetInfluences!;
      for (const [name, idx] of Object.entries(dict)) {
        const target = desired[name] ?? 0;
        const speed =
          name === "jawOpen" || name.startsWith("eyeBlink") ? 18 : 6;
        const cur = infls[idx];
        infls[idx] = THREE.MathUtils.lerp(cur, target, Math.min(1, delta * speed));
      }
    }
  });

  return <primitive object={scene} position={[0, 0, 0]} />;
}

// ─── Pure helpers ────────────────────────────────────────────────────────────

/**
 * Map (expression, persona) → static morph target values. JawOpen and blinks
 * are computed in the animation loop; everything here is "rest pose plus a
 * little personality".
 */
function computeTargets(
  expression: Expression,
  personaGlow: PersonaGlow
): Record<string, number> {
  const t: Record<string, number> = {};

  // Persona resting smile — Comedian + Friendly smile a bit at idle.
  const personaSmile =
    personaGlow === "amber" ? 0.25 :
    personaGlow === "indigo" ? 0.12 :
    0;

  // Expression overrides
  switch (expression) {
    case "smiling":
      t.mouthSmileLeft = 0.55;
      t.mouthSmileRight = 0.55;
      break;
    case "frowning":
      t.mouthFrownLeft = 0.45;
      t.mouthFrownRight = 0.45;
      t.browDownLeft = 0.4;
      t.browDownRight = 0.4;
      break;
    case "surprised":
      t.eyeWideLeft = 0.7;
      t.eyeWideRight = 0.7;
      t.browInnerUp = 0.7;
      t.mouthOpen = 0.3;
      break;
    case "thinking":
      t.browInnerUp = 0.5;
      t.mouthPucker = 0.2;
      break;
    case "nodding":
      t.mouthSmileLeft = 0.3 + personaSmile;
      t.mouthSmileRight = 0.3 + personaSmile;
      break;
    case "neutral":
    default:
      t.mouthSmileLeft = personaSmile;
      t.mouthSmileRight = personaSmile;
      break;
  }
  return t;
}

function glowToColor(glow: PersonaGlow): string {
  switch (glow) {
    case "indigo":  return "#6366f1";
    case "emerald": return "#10b981";
    case "amber":   return "#f59e0b";
    case "cyan":    return "#06b6d4";
    case "purple":  return "#8b5cf6";
    case "rose":    return "#f43f5e";
    case "teal":    return "#14b8a6";
    case "slate":   return "#64748b";
  }
}
