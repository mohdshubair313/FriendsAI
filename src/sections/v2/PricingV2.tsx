"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { FadeInUp } from "@/components/v2/ui/FadeInUp";
import { GlassPanel } from "@/components/v2/ui/GlassPanel";
import { MagneticButton } from "@/components/v2/ui/MagneticButton";

type Tier = {
  id: "free" | "pro";
  name: string;
  tagline: string;
  priceMonthly: string;
  unit: string;
  cta: string;
  href: string;
  features: string[];
  highlight?: boolean;
};

const tiers: Tier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Meet your friend.",
    priceMonthly: "₹0",
    unit: "forever",
    cta: "Start free",
    href: "/signup",
    features: [
      "Unlimited text chat",
      "Mood-aware companion",
      "Basic memory",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "The premium experience, fully unlocked.",
    priceMonthly: "₹499",
    unit: "/ month",
    cta: "Go Pro",
    href: "/premium",
    highlight: true,
    features: [
      "Live avatar sessions (Zoom-grade)",
      "Streaming voice with interruption",
      "Image / vision generation",
      "Multi-agent supervisor graph",
      "Persistent durable memory",
      "Priority providers & quotas",
    ],
  },
];

export function PricingV2() {
  const [annual, setAnnual] = React.useState(false);

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative isolate py-28 md:py-36"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_100%,rgba(138,92,246,0.08),transparent_60%)]"
      />

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="mb-12 text-center md:mb-16">
          <FadeInUp>
            <p className="v2-text-eyebrow">Pricing</p>
          </FadeInUp>
          <FadeInUp delay={0.08}>
            <h2
              id="pricing-heading"
              className="v2-font-display v2-text-h1 v2-text-gradient mt-3"
            >
              Simple, two-tier.
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.16}>
            <p className="v2-font-sans mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/60">
              Free forever for the everyday companion. Pro unlocks the premium
              live avatar, streaming voice, and the full agent graph.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.24}>
            <BillingToggle annual={annual} setAnnual={setAnnual} />
          </FadeInUp>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {tiers.map((t, i) => (
            <FadeInUp key={t.id} delay={0.1 + i * 0.08}>
              <PricingCard tier={t} annual={annual} />
            </FadeInUp>
          ))}
        </div>

        <FadeInUp delay={0.4}>
          <p className="v2-font-sans mt-10 text-center text-[13px] text-white/45">
            Prices in INR · Razorpay-secured · Cancel anytime
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}

function BillingToggle({
  annual,
  setAnnual,
}: {
  annual: boolean;
  setAnnual: (v: boolean) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Billing period"
      className="mt-8 inline-flex rounded-full v2-glass p-1"
    >
      {[
        { l: "Monthly", v: false },
        { l: "Annual · save 20%", v: true },
      ].map((o) => (
        <button
          key={o.l}
          role="tab"
          aria-selected={annual === o.v}
          onClick={() => setAnnual(o.v)}
          className={cn(
            "relative rounded-full px-4 py-1.5 text-[13px] font-medium tracking-tight transition-colors",
            annual === o.v
              ? "text-black"
              : "text-white/60 hover:text-white"
          )}
        >
          {annual === o.v && (
            <span
              aria-hidden
              className="absolute inset-0 -z-[1] rounded-full bg-white"
              style={{ boxShadow: "0 6px 24px -6px rgba(255,255,255,0.4)" }}
            />
          )}
          {o.l}
        </button>
      ))}
    </div>
  );
}

function PricingCard({ tier, annual }: { tier: Tier; annual: boolean }) {
  const proAnnualMonthly = "₹399";
  const displayPrice =
    tier.id === "pro" && annual ? proAnnualMonthly : tier.priceMonthly;
  return (
    <div className="group relative">
      {tier.highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[24px] bg-[conic-gradient(from_140deg_at_50%_50%,rgba(99,102,241,0.0)_0deg,rgba(99,102,241,0.6)_60deg,rgba(34,211,238,0.5)_180deg,rgba(168,85,247,0.6)_300deg,rgba(99,102,241,0.0)_360deg)] opacity-70 blur-[1px]"
        />
      )}
      <GlassPanel
        rounded="3xl"
        variant={tier.highlight ? "strong" : "default"}
        className={cn("relative h-full p-8 md:p-10")}
      >
        {tier.highlight && (
          <span className="absolute right-6 top-6 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold tracking-wider text-black">
            POPULAR
          </span>
        )}
        <h3 className="v2-font-sans text-[22px] font-semibold tracking-tight text-white">
          {tier.name}
        </h3>
        <p className="v2-font-sans mt-1 text-[14px] text-white/55">
          {tier.tagline}
        </p>

        <div className="mt-7 flex items-baseline gap-1.5">
          <span className="v2-font-display text-[64px] leading-none text-white">
            {displayPrice}
          </span>
          <span className="text-[14px] text-white/45">
            {tier.id === "pro" ? "/ month" : tier.unit}
          </span>
        </div>
        {tier.id === "pro" && annual && (
          <p className="mt-1 text-[12px] text-white/40">
            ₹4,788 billed annually
          </p>
        )}

        <div className="mt-8 h-px bg-white/10" />

        <ul className="mt-7 space-y-3.5">
          {tier.features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-3 text-[14px] text-white/75"
            >
              <Check />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-9">
          <MagneticButton
            asLink
            href={tier.href}
            variant={tier.highlight ? "primary" : "secondary"}
            size="lg"
            className="w-full"
            ariaLabel={`${tier.cta} — ${tier.name} plan`}
          >
            {tier.cta}
          </MagneticButton>
        </div>
      </GlassPanel>
    </div>
  );
}

function Check() {
  return (
    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-300/30 to-violet-400/30 ring-1 ring-white/15">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
        <path
          d="M2 4.5L4 6.5L7.5 2.5"
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
