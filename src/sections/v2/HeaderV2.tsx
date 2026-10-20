"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";
import { MagneticButton } from "@/components/v2/ui/MagneticButton";

const navItems = [
  { label: "Product", href: "#features" },
  { label: "Live Avatar", href: "#avatar" },
  { label: "Pricing", href: "#pricing" },
  { label: "Stories", href: "#stories" },
];

export function HeaderV2() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuButton = React.useRef<HTMLButtonElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); }
    };
    const media = window.matchMedia("(min-width: 768px)");
    const resize = () => { if (media.matches) setMenuOpen(false); };
    document.addEventListener("keydown", close);
    media.addEventListener("change", resize);
    return () => { document.removeEventListener("keydown", close); media.removeEventListener("change", resize); };
  }, [menuOpen]);

  return (
    <>
      {/* Sentinel — when this scrolls out of view, header gains glass. */}
      <div ref={sentinelRef} aria-hidden className="absolute top-[80px] h-px w-full" />

      <header
        role="banner"
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled
            ? "border-b border-white/[0.07] bg-black/55 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-[72px] md:px-8">
          <Brand />

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 rounded-full v2-glass px-1.5 py-1.5 md:flex"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-[13px] font-medium tracking-tight",
                  "text-white/70 transition-colors duration-200 hover:text-white",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <MagneticButton
              asLink
              href="/signin"
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              ariaLabel="Sign in to Friends AI"
            >
              Sign in
            </MagneticButton>
            <MagneticButton
              asLink
              href="/signup"
              variant="primary"
              size="sm"
              ariaLabel="Get started with Friends AI"
              iconRight={<ArrowRightShort />}
            >
              Get started
            </MagneticButton>
            <button ref={menuButton} type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-full border border-white/15 text-white md:hidden">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d={menuOpen ? "M5 5l10 10M15 5L5 15" : "M3 6h14M3 10h14M3 14h14"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
        <nav id="mobile-navigation" aria-label="Mobile navigation" hidden={!menuOpen} className="border-t border-white/10 bg-black/95 px-5 py-3 md:!hidden">
          {navItems.map(item => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm text-white/80">{item.label}</a>)}
          <Link href="/signin" prefetch={false} className="block px-3 py-3 text-sm text-white" onClick={() => setMenuOpen(false)}>Sign in</Link>
        </nav>
      </header>
    </>
  );
}

function Brand() {
  return (
    <Link
      href="/"
      prefetch={false}
      aria-label="Friends AI — home"
      className="group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <span aria-hidden className="relative grid h-7 w-7 place-items-center">
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#6366f1,#22d3ee,#a855f7,#6366f1)] opacity-90 blur-[2px]" />
        <span className="absolute inset-[2px] rounded-full bg-black" />
        <span className="relative h-2 w-2 rounded-full bg-white shadow-[0_0_12px_2px_rgba(255,255,255,0.7)]" />
      </span>
      <span className="v2-font-sans text-[15px] font-semibold tracking-tight text-white">
        Friends<span className="text-white/50">.ai</span>
      </span>
    </Link>
  );
}

function ArrowRightShort() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="transition-transform duration-300 group-hover:translate-x-0.5"
    >
      <path
        d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
