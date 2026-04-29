"use client";

import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import * as React from "react";
import { FadeInUp } from "@/components/v2/ui/FadeInUp";
import { GlassPanel } from "@/components/v2/ui/GlassPanel";

export function FeaturesV2() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative isolate py-28 md:py-36"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.08),transparent_60%)]"
      />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-14 max-w-3xl md:mb-20">
          <FadeInUp>
            <p className="v2-text-eyebrow mb-4">Capabilities</p>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <h2
              id="features-heading"
              className="v2-font-display v2-text-h1 v2-text-gradient"
            >
              One companion.{" "}
              <em className="not-italic v2-text-iridescent">Every modality.</em>
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <p className="v2-font-sans mt-6 max-w-2xl text-[16px] leading-relaxed text-white/60">
              Friends AI orchestrates best-in-class models across voice, vision,
              generation, and reasoning — under one entitlement-aware graph,
              with policies, fallbacks, and cost controls baked in.
            </p>
          </FadeInUp>
        </div>

        <div className="v2-bento">
          {/* 1. Live Avatar — flagship card */}
          <FadeInUp className="v2-bento-card span-7 row-2 group" delay={0}>
            <LiveAvatarCard />
          </FadeInUp>

          {/* 2. Multi-agent orchestration */}
          <FadeInUp className="v2-bento-card span-5 group" delay={0.08}>
            <OrchestrationCard />
          </FadeInUp>

          {/* 3. Voice-native */}
          <FadeInUp className="v2-bento-card span-5 group" delay={0.16}>
            <VoiceCard />
          </FadeInUp>

          {/* 4. Generation */}
          <FadeInUp className="v2-bento-card span-7 group" delay={0.24}>
            <GenerationCard />
          </FadeInUp>

          {/* 5. Memory */}
          <FadeInUp className="v2-bento-card span-4 group" delay={0.32}>
            <MemoryCard />
          </FadeInUp>

          {/* 6. Provider router */}
          <FadeInUp className="v2-bento-card span-4 group" delay={0.40}>
            <RouterCard />
          </FadeInUp>

          {/* 7. Privacy */}
          <FadeInUp className="v2-bento-card span-4 group" delay={0.48}>
            <PrivacyCard />
          </FadeInUp>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Cards
   ============================================================ */

function CardShell({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <GlassPanel
      id={id}
      rounded="3xl"
      className={cn(
        "h-full p-7 md:p-9",
        "transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "group-hover:border-white/15 group-hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </GlassPanel>
  );
}

function CardEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="v2-text-eyebrow text-white/60">{children}</p>;
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="v2-font-sans mt-3 text-[22px] font-semibold leading-tight tracking-tight text-white md:text-[26px]">
      {children}
    </h3>
  );
}
function CardBody({ children }: { children: React.ReactNode }) {
  return (
    <p className="v2-font-sans mt-3 max-w-md text-[14.5px] leading-relaxed text-white/55">
      {children}
    </p>
  );
}

/* ----- 1. Live Avatar ----- */
function LiveAvatarCard() {
  return (
    <CardShell id="avatar" className="flex h-full flex-col">
      <div className="flex flex-1 flex-col">
        <CardEyebrow>Premium · Live Avatar</CardEyebrow>
        <CardTitle>
          Speak to a face that{" "}
          <span className="v2-text-iridescent">listens back</span>.
        </CardTitle>
        <CardBody>
          A real-time, server-orchestrated avatar with low-latency turn taking,
          lip-sync, and gesture timing. WebRTC transport, entitlement gates,
          and graceful provider fallback — built for Pro.
        </CardBody>
      </div>

      <AvatarStage />

      <div className="mt-6 flex flex-wrap gap-2">
        {["WebRTC transport", "Sub-700ms turn", "Lip-sync", "Interrupt-aware"].map(
          (chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] tracking-tight text-white/65"
            >
              {chip}
            </span>
          )
        )}
      </div>
    </CardShell>
  );
}

function AvatarStage() {
  return (
    <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a14] via-black to-[#0a0e1a]">
      {/* glow */}
      <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_55%,rgba(138,92,246,0.35),transparent_70%)]" />
      {/* concentric rings */}
      <div className="absolute inset-0 grid place-items-center">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="absolute rounded-full border border-white/10"
            style={{
              width: `${30 + i * 18}%`,
              aspectRatio: "1 / 1",
              animation: `v2-float ${5 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
        {/* face proxy */}
        <div className="relative h-24 w-24 rounded-full bg-gradient-to-b from-white/15 to-white/[0.03] backdrop-blur-md ring-1 ring-white/15">
          <span className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.6),transparent_60%)]" />
        </div>
      </div>
      {/* HUD */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur-md ring-1 ring-white/10">
        <span className="grid h-1.5 w-1.5 place-items-center">
          <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-rose-400/60" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-rose-300" />
        </span>
        LIVE · 02:14
      </div>
      <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-md ring-1 ring-white/10">
        ↑ 142kbps · ↓ 96kbps
      </div>
    </div>
  );
}

/* ----- 2. Orchestration ----- */
function OrchestrationCard() {
  return (
    <CardShell className="flex h-full flex-col">
      <CardEyebrow>Orchestration</CardEyebrow>
      <CardTitle>
        Supervisor-graph routing with{" "}
        <span className="v2-text-iridescent">retries, branches, checkpoints</span>.
      </CardTitle>
      <CardBody>
        Specialist agents for sentiment, intent, persona, generation, voice,
        and avatar — coordinated by a LangGraph supervisor with durable state.
      </CardBody>
      <GraphMini />
    </CardShell>
  );
}

function GraphMini() {
  const nodes = [
    { x: 8, y: 20, label: "Intent" },
    { x: 8, y: 60, label: "Sentiment" },
    { x: 50, y: 40, label: "Supervisor", primary: true },
    { x: 92, y: 18, label: "Generate" },
    { x: 92, y: 50, label: "Voice" },
    { x: 92, y: 82, label: "Avatar" },
  ];
  return (
    <svg
      viewBox="0 0 100 100"
      className="mt-6 h-44 w-full"
      role="img"
      aria-label="Supervisor routing diagram"
    >
      <defs>
        <linearGradient id="link" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(99,102,241,0.0)" />
          <stop offset=".5" stopColor="rgba(99,102,241,0.7)" />
          <stop offset="1" stopColor="rgba(34,211,238,0.0)" />
        </linearGradient>
      </defs>
      {nodes
        .filter((n) => !n.primary)
        .map((n, i) => (
          <line
            key={i}
            x1={n.x}
            y1={n.y}
            x2={50}
            y2={40}
            stroke="url(#link)"
            strokeWidth="0.4"
          />
        ))}
      {nodes.map((n) => (
        <g key={n.label} transform={`translate(${n.x} ${n.y})`}>
          <circle
            r={n.primary ? 3.4 : 2.4}
            fill={n.primary ? "#fff" : "rgba(255,255,255,0.85)"}
            opacity={n.primary ? 1 : 0.85}
          />
          {n.primary && <circle r="6" fill="rgba(99,102,241,0.18)" />}
          <text
            y={n.primary ? -6 : -4.5}
            textAnchor="middle"
            fontSize="3"
            fill="rgba(255,255,255,0.65)"
            fontFamily="var(--font-geist), sans-serif"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ----- 3. Voice ----- */
function VoiceCard() {
  return (
    <CardShell className="flex h-full flex-col">
      <CardEyebrow>Voice</CardEyebrow>
      <CardTitle>Streaming TTS that turns on a dime.</CardTitle>
      <CardBody>
        Interrupt-aware low-latency voice with server-side provider routing —
        switch models per-utterance based on language, mood, and quota.
      </CardBody>
      <VoiceWaveform />
    </CardShell>
  );
}

function VoiceWaveform() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const bars = 36;
  return (
    <div ref={ref} className="mt-6 flex h-20 items-end gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[6px] rounded-sm bg-gradient-to-t from-violet-500/70 to-cyan-300/90"
          initial={{ height: 4 }}
          animate={
            inView
              ? {
                  height: [
                    6 + Math.abs(Math.sin((i + 1) * 0.7)) * 50,
                    8 + Math.abs(Math.sin((i + 4) * 0.5)) * 60,
                    4 + Math.abs(Math.sin((i + 7) * 0.9)) * 40,
                  ],
                }
              : { height: 4 }
          }
          transition={{
            duration: 1.6 + (i % 5) * 0.15,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: i * 0.02,
          }}
        />
      ))}
    </div>
  );
}

/* ----- 4. Generation ----- */
function GenerationCard() {
  return (
    <CardShell className="flex h-full flex-col">
      <div className="flex flex-1 flex-col">
        <CardEyebrow>Multimodal generation</CardEyebrow>
        <CardTitle>
          Images, classifications, detections —{" "}
          <span className="v2-text-iridescent">queued and observable</span>.
        </CardTitle>
        <CardBody>
          BullMQ-backed media jobs with status webhooks, moderation, and
          per-tier quotas. Fall back gracefully across NVIDIA NIM and
          OpenRouter providers.
        </CardBody>
      </div>
      <GenerationMosaic />
    </CardShell>
  );
}

function GenerationMosaic() {
  const tiles = [
    "from-violet-500/40 to-fuchsia-500/40",
    "from-cyan-400/40 to-indigo-500/40",
    "from-emerald-300/30 to-cyan-400/40",
    "from-rose-400/30 to-orange-300/30",
    "from-indigo-400/40 to-violet-500/40",
    "from-amber-300/30 to-rose-400/40",
  ];
  return (
    <div className="mt-6 grid grid-cols-6 gap-2">
      {tiles.map((g, i) => (
        <div
          key={i}
          className={cn(
            "relative aspect-square overflow-hidden rounded-lg ring-1 ring-white/10",
            "bg-gradient-to-br",
            g
          )}
          style={{ animation: `v2-float ${4 + i * 0.3}s ease-in-out infinite` }}
        >
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
          <span className="absolute bottom-1.5 left-1.5 text-[9px] font-medium uppercase tracking-wider text-white/70">
            #{(i + 1).toString().padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ----- 5. Memory ----- */
function MemoryCard() {
  return (
    <CardShell className="flex h-full flex-col">
      <CardEyebrow>Persistent memory</CardEyebrow>
      <CardTitle>It remembers — only what you let it.</CardTitle>
      <CardBody>
        Conversation, preference, and emotion events stored as durable
        documents. Edit, export, or wipe at any time.
      </CardBody>
      <ul className="mt-6 space-y-2 text-[13px] text-white/65">
        {["Episodic", "Semantic", "Affective"].map((l) => (
          <li key={l} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
            {l} memory
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

/* ----- 6. Router ----- */
function RouterCard() {
  return (
    <CardShell className="flex h-full flex-col">
      <CardEyebrow>Provider router</CardEyebrow>
      <CardTitle>Best model, every task.</CardTitle>
      <CardBody>
        Policy-driven routing across NVIDIA, OpenRouter, and direct vendors —
        with cost ceilings and latency targets per node.
      </CardBody>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {[
          { l: "NVIDIA", v: "82%" },
          { l: "OpenRouter", v: "14%" },
          { l: "Direct", v: "3%" },
          { l: "Fallback", v: "1%" },
        ].map((t) => (
          <div
            key={t.l}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px]"
          >
            <span className="text-white/70">{t.l}</span>
            <span className="font-medium text-white">{t.v}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

/* ----- 7. Privacy ----- */
function PrivacyCard() {
  return (
    <CardShell className="flex h-full flex-col">
      <CardEyebrow>Privacy</CardEyebrow>
      <CardTitle>Yours, encrypted, and never trained on.</CardTitle>
      <CardBody>
        Per-user keys, scoped entitlements, signed webhooks, and zero training
        on conversation content. Period.
      </CardBody>
      <div className="mt-6 flex items-center gap-3">
        <Shield />
        <div className="text-[12px] text-white/60">
          <div className="text-white/85">SOC2-aligned controls</div>
          <div>Encrypted at rest & in transit</div>
        </div>
      </div>
    </CardShell>
  );
}

function Shield() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l8 3v6c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V6l8-3z"
          stroke="currentColor"
          strokeWidth="1.4"
          className="text-cyan-300"
        />
        <path
          d="M9 12.5l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        />
      </svg>
    </span>
  );
}
