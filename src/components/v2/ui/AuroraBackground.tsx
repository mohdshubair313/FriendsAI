"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface AuroraBackgroundProps {
  variant?: "default" | "soft" | "none";
  withGrid?: boolean;
  withNoise?: boolean;
  className?: string;
}

/**
 * Decorative back-layer for sections — animated radial gradients,
 * optional hairline grid + film grain. Inert and aria-hidden.
 */
export function AuroraBackground({
  variant = "default",
  withGrid = false,
  withNoise = true,
  className,
}: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {variant === "default" && <div className="v2-aurora" />}
      {variant === "soft" && <div className="v2-aurora-soft" />}
      {withGrid && <div className="v2-grid-bg absolute inset-0 opacity-60" />}
      {withNoise && <div className="v2-noise" />}
    </div>
  );
}
