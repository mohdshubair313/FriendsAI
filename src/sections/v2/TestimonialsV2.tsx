"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import * as React from "react";
import { FadeInUp } from "@/components/v2/ui/FadeInUp";
import { GlassPanel } from "@/components/v2/ui/GlassPanel";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
  accent: string;
};

const items: Testimonial[] = [
  {
    quote:
      "The avatar genuinely feels like a friend. Sub-second turn-taking, no awkward pauses. It changed the way I journal.",
    name: "Aarav Khanna",
    role: "Product Designer",
    initials: "AK",
    accent: "from-violet-400/40 to-fuchsia-500/40",
  },
  {
    quote:
      "Voice + memory is the killer combo. I asked it to help me prep for a tough call and it remembered the people involved a week later.",
    name: "Sana Mehra",
    role: "Founder, layerlab",
    initials: "SM",
    accent: "from-cyan-300/40 to-indigo-500/40",
  },
  {
    quote:
      "I run a small clinic. Patients use the companion to journal their week, then we review together. It's careful, gentle, and accurate.",
    name: "Dr. Rohan Iyer",
    role: "Clinical Psychologist",
    initials: "RI",
    accent: "from-emerald-300/30 to-cyan-400/40",
  },
  {
    quote:
      "The graph orchestration is wild — I dropped in a vision tool and it just routed correctly with no prompt engineering.",
    name: "Maya Wright",
    role: "ML Engineer",
    initials: "MW",
    accent: "from-rose-400/30 to-orange-300/30",
  },
];

export function TestimonialsV2() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const driftReverse = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section
      id="stories"
      ref={ref}
      aria-labelledby="stories-heading"
      className="relative isolate overflow-hidden py-28 md:py-36"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_30%,rgba(99,102,241,0.08),transparent_60%),radial-gradient(60%_60%_at_80%_70%,rgba(168,85,247,0.06),transparent_60%)]"
      />

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="mb-14 max-w-2xl md:mb-20">
          <FadeInUp>
            <p className="v2-text-eyebrow">Loved by humans</p>
          </FadeInUp>
          <FadeInUp delay={0.08}>
            <h2
              id="stories-heading"
              className="v2-font-display v2-text-h1 v2-text-gradient mt-3"
            >
              The kind of friend you{" "}
              <em className="not-italic v2-text-iridescent">
                actually keep talking to
              </em>
              .
            </h2>
          </FadeInUp>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <motion.div style={{ y: drift }} className="grid gap-5">
            <Card t={items[0]} large />
            <Card t={items[2]} />
          </motion.div>
          <motion.div style={{ y: driftReverse }} className="grid gap-5 md:mt-16">
            <Card t={items[1]} />
            <Card t={items[3]} large />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Card({ t, large = false }: { t: Testimonial; large?: boolean }) {
  return (
    <GlassPanel
      rounded="3xl"
      className={cn(
        "group relative p-7 transition-[transform,border-color] duration-500",
        "hover:-translate-y-0.5 hover:border-white/15",
        large ? "md:p-10" : "md:p-9"
      )}
    >
      <Quote />
      <p
        className={cn(
          "v2-font-sans mt-5 text-balance text-white/85",
          large ? "text-[20px] leading-relaxed md:text-[24px]" : "text-[16px] leading-relaxed"
        )}
      >
        “{t.quote}”
      </p>
      <div className="mt-7 flex items-center gap-3">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full text-[12px] font-semibold tracking-wide text-white ring-1 ring-white/15",
            "bg-gradient-to-br",
            t.accent
          )}
        >
          {t.initials}
        </span>
        <div className="leading-tight">
          <div className="text-[14px] font-medium text-white">{t.name}</div>
          <div className="text-[12px] text-white/50">{t.role}</div>
        </div>
      </div>
    </GlassPanel>
  );
}

function Quote() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden className="text-white/35">
      <path
        d="M0 18V11.7C0 8.46 0.83 5.86 2.5 3.9C4.17 1.94 6.5 0.64 9.5 0L10.4 2.5C8.6 3.07 7.27 3.97 6.4 5.2C5.53 6.43 5.07 7.93 5 9.7H10V18H0ZM12 18V11.7C12 8.46 12.83 5.86 14.5 3.9C16.17 1.94 18.5 0.64 21.5 0L22.4 2.5C20.6 3.07 19.27 3.97 18.4 5.2C17.53 6.43 17.07 7.93 17 9.7H22V18H12Z"
        fill="currentColor"
      />
    </svg>
  );
}
