"use client";

import { Canvas } from "@react-three/fiber";
import { ParticleTorusScene } from "./ParticleTorus";

interface SceneCanvasProps {
  active: boolean;
  reducedMotion: boolean;
  count?: number;
  eventSource?: HTMLElement;
}

/** Keep full particle density and DPR; suspend draws when the hero is hidden. */
export function SceneCanvas({ active, reducedMotion, count, eventSource }: SceneCanvasProps) {
  return (
    <Canvas
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      dpr={[1, 2]}
      eventSource={eventSource}
      eventPrefix="client"
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: false,
      }}
      camera={{ position: [0, 0.4, 4.2], fov: 45 }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }}
    >
      <ParticleTorusScene count={count} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
