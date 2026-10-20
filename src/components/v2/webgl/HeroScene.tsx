"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { usePageVisible } from "@/components/v2/ui/usePageVisible";

const SceneCanvas = dynamic(() => import("./SceneCanvas").then(module => module.SceneCanvas), {
  ssr: false,
  loading: SceneFallback,
});

function SceneFallback() {
  return <div className="absolute inset-0 grid place-items-center" aria-hidden="true"><div className="h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.35),transparent_60%)] blur-2xl animate-[v2-float_4s_ease-in-out_infinite]" /></div>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <SceneFallback /> : this.props.children; }
}

export function HeroScene({ className }: { className?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [load, setLoad] = useState(false);
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();
  const active = inView && pageVisible;

  useEffect(() => {
    if (!wrapper.current) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || load) return;
    let frame = 0;
    let idle: number | undefined;
    let paintObserver: PerformanceObserver | undefined;
    // Let HTML and the hero entrance paint before parsing Three.js. This is
    // automatic, not click-to-play, and the original full scene still loads.
    const schedule = () => {
      paintObserver?.disconnect();
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if ("requestIdleCallback" in window) {
            idle = window.requestIdleCallback(() => setLoad(true), { timeout: 750 });
          } else {
            setLoad(true);
          }
        });
      });
    };
    // Two animation frames alone do not guarantee text has painted (fonts and
    // entrance opacity can delay FCP). Prefer the browser's actual paint signal.
    if (performance.getEntriesByName("first-contentful-paint").length > 0) {
      schedule();
    } else if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes.includes("paint")) {
      paintObserver = new PerformanceObserver(entries => {
        if (entries.getEntries().some(entry => entry.name === "first-contentful-paint")) schedule();
      });
      paintObserver.observe({ type: "paint", buffered: true });
    } else {
      schedule();
    }
    return () => {
      paintObserver?.disconnect();
      cancelAnimationFrame(frame);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, [active, load]);

  return (
    <div ref={wrapper} aria-hidden="true" className={className} style={{ contain: "strict" }} data-hero-scene data-rendering={active ? (reducedMotion ? "still" : "active") : "paused"}>
      <SceneBoundary>
        {load ? <SceneCanvas active={active} reducedMotion={!!reducedMotion} eventSource={wrapper.current?.parentElement ?? undefined} /> : <SceneFallback />}
      </SceneBoundary>
    </div>
  );
}
