"use client";

import * as React from "react";
import { m, useInView, useReducedMotion } from "framer-motion";
import { usePageVisible } from "./usePageVisible";

export function VoiceWaveform() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const pageVisible = usePageVisible();
  const reduced = useReducedMotion();
  const bars = 36;
  return (
    <div ref={ref} data-voice-waveform aria-hidden="true" className="mt-6 flex h-20 items-end gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => (
        <m.span
          key={i}
          className="w-[6px] rounded-sm bg-gradient-to-t from-violet-500/70 to-cyan-300/90"
          style={{ height: 80, transformOrigin: "bottom" }}
          initial={{ scaleY: 0.05 }}
          animate={
            inView && pageVisible && !reduced
              ? {
                  scaleY: [
                    6 + Math.abs(Math.sin((i + 1) * 0.7)) * 50,
                    8 + Math.abs(Math.sin((i + 4) * 0.5)) * 60,
                    4 + Math.abs(Math.sin((i + 7) * 0.9)) * 40,
                  ].map(height => height / 80),
                }
              : { scaleY: reduced ? (6 + Math.abs(Math.sin((i + 1) * 0.7)) * 50) / 80 : 0.05 }
          }
          transition={{
            duration: 1.6 + (i % 5) * 0.15,
            repeat: inView && pageVisible && !reduced ? Infinity : 0,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: i * 0.02,
          }}
        />
      ))}
    </div>
  );
}
