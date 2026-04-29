"use client";

import * as React from "react";
import { HeaderV2 } from "@/sections/v2/HeaderV2";
import { HeroV2 } from "@/sections/v2/HeroV2";
import { TrustedByV2 } from "@/sections/v2/TrustedByV2";
import { FeaturesV2 } from "@/sections/v2/FeaturesV2";
import { PricingV2 } from "@/sections/v2/PricingV2";
import { TestimonialsV2 } from "@/sections/v2/TestimonialsV2";
import { CallToActionV2 } from "@/sections/v2/CallToActionV2";
import { FooterV2 } from "@/sections/v2/FooterV2";

export default function ClientHomepageV2() {
  return (
    <div className="v2-font-sans relative min-h-screen bg-black text-white antialiased">
      {/* Skip-to-content for keyboard users */}
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to content
      </a>

      <HeaderV2 />

      <main id="main">
        <HeroV2 />
        <TrustedByV2 />
        <FeaturesV2 />
        <PricingV2 />
        <TestimonialsV2 />
        <CallToActionV2 />
      </main>

      <FooterV2 />
    </div>
  );
}
