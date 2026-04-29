"use client";

import * as React from "react";
import { Marquee } from "@/components/v2/ui/Marquee";
import { FadeInUp } from "@/components/v2/ui/FadeInUp";

const stack = [
  "LangGraph",
  "Vercel AI SDK",
  "NVIDIA NIM",
  "OpenRouter",
  "MongoDB",
  "BullMQ",
  "Razorpay",
  "Next.js 16",
  "React 19",
  "Mongoose",
];

export function TrustedByV2() {
  return (
    <section
      aria-labelledby="trusted-heading"
      className="relative border-y border-white/[0.06] bg-black/40 py-12 md:py-16"
    >
      <FadeInUp className="mx-auto max-w-7xl px-5 md:px-8">
        <h2
          id="trusted-heading"
          className="v2-text-eyebrow mb-8 text-center text-white/55"
        >
          Built on the production AI stack
        </h2>
      </FadeInUp>

      <Marquee
        ariaLabel="Technologies powering Friends AI"
        speedSec={42}
      >
        {stack.map((s) => (
          <span
            key={s}
            className="v2-font-sans select-none whitespace-nowrap text-[15px] font-medium tracking-tight text-white/45 transition-colors duration-300 hover:text-white"
          >
            {s}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
