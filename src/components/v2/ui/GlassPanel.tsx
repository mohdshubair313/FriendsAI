"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong";
  rounded?: "lg" | "xl" | "2xl" | "3xl";
  withBorderGlow?: boolean;
  as?: "div" | "section" | "article";
}

const radii = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
} as const;

export function GlassPanel({
  variant = "default",
  rounded = "2xl",
  withBorderGlow = false,
  as: Tag = "div",
  className,
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <Tag
      className={cn(
        "relative isolate",
        variant === "strong" ? "v2-glass-strong" : "v2-glass",
        radii[rounded],
        className
      )}
      {...rest}
    >
      {withBorderGlow && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-px",
            radii[rounded],
            "bg-[conic-gradient(from_180deg_at_50%_50%,rgba(99,102,241,0.0),rgba(99,102,241,0.55),rgba(34,211,238,0.0),rgba(138,92,246,0.55),rgba(99,102,241,0.0))]",
            "opacity-0 transition-opacity duration-500 [mask-image:linear-gradient(black,black),linear-gradient(black,black)] [mask-clip:padding-box,border-box] [mask-composite:exclude]",
            "group-hover:opacity-60"
          )}
        />
      )}
      {children}
    </Tag>
  );
}
