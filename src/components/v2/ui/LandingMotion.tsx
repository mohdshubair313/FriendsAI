"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/** Share animation features once; retain the full visual treatment. */
export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const visibility = () => {
      element.dataset.pageHidden = String(document.hidden);
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    // CSS animations resume in their current position when a section returns.
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        (entry.target as HTMLElement).dataset.animationPaused = String(!entry.isIntersecting);
      });
    }, { rootMargin: "100px" });
    element.querySelectorAll("main > section").forEach(section => observer.observe(section));
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div ref={root} className="v2-motion-root">{children}</div>
      </MotionConfig>
    </LazyMotion>
  );
}
