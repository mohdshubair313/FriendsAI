"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";

interface ParticleTorusProps {
  count?: number;
  R?: number;
  r?: number;
  pointSize?: number;
  jitter?: number;
}

/**
 * High-density point cloud distributed on a torus surface.
 *
 * - Each point gets a parametric (u, v) position with a radial jitter for organic depth.
 * - Color is sampled along an indigo→cyan→violet ramp keyed to the major angle u.
 * - Alpha varies with z to fake atmospheric depth on a flat shader.
 * - The whole field rotates slowly and pitches by mouse position with damping.
 */
function TorusPoints({
  count = 5200,
  R = 1.6,
  r = 0.55,
  pointSize = 0.022,
  jitter = 0.08,
}: ParticleTorusProps) {
  const ref = React.useRef<THREE.Points>(null);
  const { mouse, viewport } = useThree();

  const { positions, colors, sizes } = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const cA = new THREE.Color("#6366f1"); // indigo
    const cB = new THREE.Color("#22d3ee"); // cyan
    const cC = new THREE.Color("#a855f7"); // violet
    const tmp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Bias sampling so the cross-section wraps the surface uniformly.
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const j = (Math.random() - 0.5) * 2 * jitter;

      const cu = Math.cos(u);
      const su = Math.sin(u);
      const cv = Math.cos(v);
      const sv = Math.sin(v);

      // Torus parametric, jittered along surface normal.
      const x = (R + (r + j) * cv) * cu;
      const y = (r + j) * sv;
      const z = (R + (r + j) * cv) * su;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Two-stop ramp by major angle, then blend a violet pop near top of v.
      const t = (Math.cos(u) + 1) * 0.5;
      tmp.copy(cA).lerp(cB, t);
      tmp.lerp(cC, Math.max(0, sv) * 0.55);

      // Slight per-point luminance variance for sparkle.
      const lum = 0.7 + Math.random() * 0.5;
      colors[i * 3 + 0] = tmp.r * lum;
      colors[i * 3 + 1] = tmp.g * lum;
      colors[i * 3 + 2] = tmp.b * lum;

      sizes[i] = pointSize * (0.6 + Math.random() * 0.9);
    }

    return { positions, colors, sizes };
  }, [count, R, r, pointSize, jitter]);

  // Smoothed mouse vector for parallax.
  const targetRot = React.useRef({ x: 0.45, y: 0 });
  const rot = React.useRef({ x: 0.45, y: 0 });

  useFrame((_state, dt) => {
    const points = ref.current;
    if (!points) return;

    // mouse is normalized [-1, 1]; viewport gives us aspect for subtle weighting.
    const mx = mouse.x;
    const my = mouse.y;
    targetRot.current.y = mx * 0.5;
    targetRot.current.x = 0.45 + -my * 0.35;

    // Critically-damped lerp.
    const k = 1 - Math.exp(-dt * 4);
    rot.current.x += (targetRot.current.x - rot.current.x) * k;
    rot.current.y += (targetRot.current.y - rot.current.y) * k;

    points.rotation.x = rot.current.x;
    points.rotation.y += dt * 0.06; // slow auto-spin
    points.rotation.z = rot.current.y * 0.15;

    // Subtle breathing scale.
    const t = performance.now() * 0.0006;
    const s = 1 + Math.sin(t) * 0.012;
    points.scale.setScalar(s);

    // Aspect-aware nudge on small screens.
    if (viewport.aspect < 1) {
      points.position.y = -0.1;
    } else {
      points.position.y = 0;
    }
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={pointSize}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Inner-ring counter-rotating accent ring for visual richness.
 */
function AccentRing() {
  const ref = React.useRef<THREE.Points>(null);
  const count = 1200;
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 1.05 + Math.random() * 0.08;
      arr[i * 3 + 0] = Math.cos(a) * rad;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.04;
      arr[i * 3 + 2] = Math.sin(a) * rad;
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y -= dt * 0.18;
    ref.current.rotation.x = 0.5;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#a5f3fc"
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function ParticleTorusScene(props: ParticleTorusProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <TorusPoints {...props} />
      <AccentRing />
    </>
  );
}
