"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  speedSec?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Pure CSS marquee — duplicates children once and translates -50%.
 * Mask edges fade for a premium feel.
 */
export function Marquee({
  children,
  speedSec = 32,
  reverse = false,
  pauseOnHover = true,
  className,
  ariaLabel,
}: MarqueeProps) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn(
        "v2-marquee-mask group relative flex w-full overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-12 pr-12 will-change-transform",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{
          animation: `marquee ${speedSec}s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "flex shrink-0 items-center gap-12 pr-12 will-change-transform",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{
          animation: `marquee ${speedSec}s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
