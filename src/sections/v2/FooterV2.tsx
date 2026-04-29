"use client";

import * as React from "react";

const cols: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Companion chat", href: "/chat" },
      { label: "Live avatar", href: "#avatar" },
      { label: "Voice mode", href: "/live_talk" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Agent graph", href: "#features" },
      { label: "Provider router", href: "#features" },
      { label: "Memory", href: "#features" },
      { label: "API access", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export function FooterV2() {
  return (
    <footer
      role="contentinfo"
      className="relative border-t border-white/[0.06] pt-20 pb-10"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="v2-font-sans mt-5 max-w-sm text-[14px] leading-relaxed text-white/55">
              An agentic companion for thinking, creating, and being heard.
              Built with care.
            </p>
            <p className="mt-6 text-[12px] text-white/35">
              © {new Date().getFullYear()} Friends AI. All rights reserved.
            </p>
          </div>

          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="v2-text-eyebrow mb-5 text-white/55">{c.title}</h3>
              <ul className="space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[14px] text-white/65 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Massive wordmark — editorial closing flourish */}
        <div
          aria-hidden
          className="mt-20 flex items-end justify-center overflow-hidden"
        >
          <span
            className="v2-font-display block bg-gradient-to-b from-white/[0.08] to-transparent bg-clip-text text-transparent leading-[0.85]"
            style={{ fontSize: "clamp(80px, 18vw, 260px)", letterSpacing: "-0.05em" }}
          >
            Friends.ai
          </span>
        </div>
      </div>
    </footer>
  );
}

function Logo() {
  return (
    <a href="/v2" aria-label="Friends AI — home" className="inline-flex items-center gap-2.5">
      <span aria-hidden className="relative grid h-7 w-7 place-items-center">
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#6366f1,#22d3ee,#a855f7,#6366f1)] opacity-90 blur-[2px]" />
        <span className="absolute inset-[2px] rounded-full bg-black" />
        <span className="relative h-2 w-2 rounded-full bg-white shadow-[0_0_12px_2px_rgba(255,255,255,0.7)]" />
      </span>
      <span className="v2-font-sans text-[15px] font-semibold tracking-tight text-white">
        Friends<span className="text-white/50">.ai</span>
      </span>
    </a>
  );
}
