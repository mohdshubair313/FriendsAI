"use client";

import dynamic from "next/dynamic";
const FluidOrb = dynamic(() => import("@/components/ui/fluid-orb"), {
  ssr: false,
  loading: () => <div className="size-full rounded-full bg-gradient-to-br from-white via-indigo-300 to-indigo-600" />,
});

export default function VoiceOrb({ color = "#8b5cf6", size = 256 }: { color?: string; size?: number }) {
  return <div className="aspect-square max-w-full" style={{ width: size }}>
    <FluidOrb color={color} size={size} aria-hidden="true" style={{ width: "100%", height: "100%" }} />
  </div>;
}
