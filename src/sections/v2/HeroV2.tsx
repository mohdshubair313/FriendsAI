"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import * as React from "react";
import { MagneticButton } from "@/components/v2/ui/MagneticButton";
import { AuroraBackground } from "@/components/v2/ui/AuroraBackground";

const SceneCanvas = dynamic(
  () => import("@/components/v2/webgl/SceneCanvas").then((m) => m.SceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="absolute inset-0 grid place-items-center"
      >
        <div className="h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.35),transparent_60%)] blur-2xl animate-[v2-float_4s_ease-in-out_infinite]" />
      </div>
    ),
  }
);

export function HeroV2() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden pb-32 pt-32 md:pb-44 md:pt-44"
    >
      <AuroraBackground variant="default" withGrid withNoise />
      <div className="v2-spotlight" />

      {/* WebGL torus, behind content */}
      <SceneCanvas
        className="pointer-events-none absolute inset-0 -z-[1] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,black,transparent_75%)]"
      />

      <div className="relative z-[2] mx-auto flex max-w-7xl flex-col items-center px-5 text-center md:px-8">
        <Eyebrow />

        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className={cn(
            "v2-font-display v2-text-display mt-7 max-w-[18ch] text-balance",
            "text-white"
          )}
        >
          A friend that{" "}
          <em className="not-italic v2-text-iridescent">
            thinks with you
          </em>
          ,
          <br className="hidden md:inline" /> not at you.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          className="v2-font-sans mt-7 max-w-[58ch] text-balance text-[15px] leading-relaxed text-white/65 md:text-[17px]"
        >
          Friends AI is a multimodal companion built on a LangGraph-orchestrated
          agent stack. Talk, see, generate, and meet a live avatar — all under
          one roof, all latency-tuned, all yours.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <MagneticButton
            asLink
            href="/signup"
            size="lg"
            ariaLabel="Start a conversation with Friends AI"
            iconRight={<ArrowRight />}
          >
            Start a conversation
          </MagneticButton>
          <MagneticButton
            asLink
            href="#avatar"
            variant="secondary"
            size="lg"
            ariaLabel="See the live avatar in action"
            iconLeft={<PlayDot />}
          >
            See the live avatar
          </MagneticButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-14 flex flex-col items-center gap-3 text-[12px] text-white/40 md:flex-row md:gap-6"
        >
          <span className="inline-flex items-center gap-2">
            <PulseDot />
            Live avatar in private beta
          </span>
          <span className="hidden h-3 w-px bg-white/15 md:block" />
          <span>SOC2-aligned · Encrypted at rest · No training on your chats</span>
        </motion.div>
      </div>

      {/* Bottom fade-out into next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-black"
      />
    </section>
  );
}

function Eyebrow() {
  return (
    <motion.a
      href="#features"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full v2-glass px-3 py-1.5",
        "v2-text-eyebrow text-white/75 transition-colors duration-200 hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      )}
      aria-label="What's new — multi-agent orchestration is live"
    >
      <span className="relative grid h-1.5 w-1.5 place-items-center">
        <span className="absolute inset-0 rounded-full bg-cyan-400 blur-[2px] animate-pulse" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-cyan-300" />
      </span>
      <span>New</span>
      <span className="h-3 w-px bg-white/20" />
      <span className="normal-case tracking-normal text-white/70 text-[11px]">
        Multi-agent orchestration is live
      </span>
      <ChevronRight />
    </motion.a>
  );
}

function ChevronRight() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className="transition-transform duration-300 group-hover:translate-x-0.5"
    >
      <path
        d="M3.5 2L6.5 5L3.5 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10m0 0L9 4m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PlayDot() {
  return (
    <span className="relative grid h-3.5 w-3.5 place-items-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/30" />
      <span className="relative h-2 w-2 rounded-full bg-cyan-300" />
    </span>
  );
}
function PulseDot() {
  return (
    <span className="relative grid h-2 w-2 place-items-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/40" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-violet-300" />
    </span>
  );
}
