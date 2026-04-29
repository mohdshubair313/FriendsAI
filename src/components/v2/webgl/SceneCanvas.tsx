"use client";

import { Canvas } from "@react-three/fiber";
import * as React from "react";
import { ParticleTorusScene } from "./ParticleTorus";

interface SceneCanvasProps {
  className?: string;
  count?: number;
}

/**
 * Canvas wrapper for the particle torus.
 * - Lazy-mounts via IntersectionObserver to avoid first-paint jank.
 * - Caps DPR at 2 for high-DPI; lowers point count under reduced-motion.
 * - aria-hidden — purely decorative.
 */
export function SceneCanvas({ className, count }: SceneCanvasProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
  }, []);

  React.useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldMount(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className={className}
      style={{ contain: "strict" }}
    >
      {shouldMount && (
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: false,
          }}
          camera={{ position: [0, 0.4, 4.2], fov: 45 }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <ParticleTorusScene count={reduced ? 2400 : count} />
        </Canvas>
      )}
    </div>
  );
}
