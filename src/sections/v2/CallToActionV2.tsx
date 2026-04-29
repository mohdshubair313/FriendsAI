"use client";

import * as React from "react";
import { FadeInUp } from "@/components/v2/ui/FadeInUp";
import { MagneticButton } from "@/components/v2/ui/MagneticButton";

export function CallToActionV2() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative isolate overflow-hidden py-28 md:py-40"
    >
      {/* Big aurora — this section is the volumetric beat of the page */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute inset-x-0 -top-[20%] h-[700px]"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 50%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(40% 50% at 30% 60%, rgba(168,85,247,0.3), transparent 60%), radial-gradient(40% 50% at 70% 60%, rgba(34,211,238,0.25), transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        <div className="v2-grid-bg absolute inset-0 opacity-50" />
      </div>

      <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
        <FadeInUp>
          <p className="v2-text-eyebrow">Ready when you are</p>
        </FadeInUp>
        <FadeInUp delay={0.08}>
          <h2
            id="cta-heading"
            className="v2-font-display v2-text-h1 mt-4 max-w-[16ch] mx-auto text-balance text-white"
          >
            Some friends listen.{" "}
            <em className="not-italic v2-text-iridescent">
              This one understands.
            </em>
          </h2>
        </FadeInUp>
        <FadeInUp delay={0.16}>
          <p className="v2-font-sans mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-white/65 md:text-[18px]">
            One account. Voice, vision, generation, and a live avatar. Free
            forever for the basics. Pro when you&rsquo;re ready for the full thing.
          </p>
        </FadeInUp>
        <FadeInUp delay={0.24}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MagneticButton
              asLink
              href="/signup"
              size="lg"
              ariaLabel="Create your free Friends AI account"
              iconRight={<ArrowRight />}
            >
              Create your account
            </MagneticButton>
            <MagneticButton
              asLink
              href="/premium"
              variant="secondary"
              size="lg"
              ariaLabel="See Pro plan details"
            >
              See Pro
            </MagneticButton>
          </div>
        </FadeInUp>
        <FadeInUp delay={0.32}>
          <p className="mt-8 text-[13px] text-white/45">
            No credit card required. Cancel any time.
          </p>
        </FadeInUp>
      </div>
    </section>
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
