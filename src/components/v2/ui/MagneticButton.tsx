"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  m,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import * as React from "react";

const MotionLink = m.create(Link);

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  strength?: number;
  ariaLabel?: string;
  iconRight?: React.ReactNode;
  iconLeft?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

type ButtonProps = CommonProps &
  Omit<HTMLMotionProps<"button">, keyof CommonProps | "ref"> & {
    asLink?: false;
    href?: never;
  };

type LinkProps = CommonProps &
  Omit<HTMLMotionProps<"a">, keyof CommonProps | "ref"> & {
    asLink: true;
    href: string;
  };

type MagneticButtonProps = ButtonProps | LinkProps;

const variants: Record<Variant, string> = {
  primary:
    "text-black bg-white hover:bg-white shadow-[0_10px_40px_-12px_rgba(255,255,255,0.45)]",
  secondary: "text-white v2-glass-strong hover:bg-white/[0.06]",
  ghost:
    "text-white/80 hover:text-white border border-transparent hover:border-white/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] rounded-full",
  md: "h-11 px-5 text-[14px] rounded-full",
  lg: "h-14 px-7 text-[15px] rounded-full",
};

/**
 * Magnetic button with spring-physics translate and subtle hover shine.
 * Reduces translate strength when prefers-reduced-motion is set.
 */
export function MagneticButton(props: MagneticButtonProps) {
  const {
    variant = "primary",
    size = "md",
    strength = 18,
    className,
    children,
    ariaLabel,
    iconLeft,
    iconRight,
  } = props;

  const ref = React.useRef<HTMLElement | null>(null);
  const bounds = React.useRef<DOMRect | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 320, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 320, damping: 22, mass: 0.6 });
  const reduce = useReducedMotion();

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = bounds.current ?? (bounds.current = el.getBoundingClientRect());
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  };
  const onLeave = () => {
    bounds.current = null;
    x.set(0);
    y.set(0);
  };

  const innerX = useTransform(sx, (v) => v * 0.4);
  const innerY = useTransform(sy, (v) => v * 0.4);

  const sharedClassName = cn(
    "group relative inline-flex items-center justify-center gap-2 font-medium tracking-tight",
    "v2-press select-none outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    "overflow-hidden whitespace-nowrap",
    sizes[size],
    variants[variant],
    className
  );

  const inner = (
    <>
      {variant !== "ghost" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        >
          <span className="absolute -inset-y-2 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:[animation:v2-shine_900ms_ease-in-out]" />
        </span>
      )}
      <m.span
        style={{ x: innerX, y: innerY }}
        className="relative z-[1] inline-flex items-center gap-2"
      >
        {iconLeft && <span className="flex shrink-0">{iconLeft}</span>}
        <span>{children}</span>
        {iconRight && <span className="flex shrink-0">{iconRight}</span>}
      </m.span>
    </>
  );

  if (props.asLink) {
    const Anchor = props.href.startsWith("/") ? MotionLink : m.a;
    const { asLink: _, variant: __, size: ___, strength: ____, ariaLabel: _____, iconLeft: ______, iconRight: _______, className: ________, children: _________, ...anchorRest } = props;
    void _; void __; void ___; void ____; void _____; void ______; void _______; void ________; void _________;
    return (
      <Anchor
        {...(props.href.startsWith("/") ? { prefetch: false } : {})}
        ref={ref as React.RefObject<HTMLAnchorElement>}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ x: sx, y: sy }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        aria-label={ariaLabel}
        className={sharedClassName}
        {...anchorRest}
      >
        {inner}
      </Anchor>
    );
  }

  const { asLink: _, variant: __, size: ___, strength: ____, ariaLabel: _____, iconLeft: ______, iconRight: _______, className: ________, children: _________, ...buttonRest } = props;
  void _; void __; void ___; void ____; void _____; void ______; void _______; void ________; void _________;
  return (
    <m.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      aria-label={ariaLabel}
      className={sharedClassName}
      {...buttonRest}
    >
      {inner}
    </m.button>
  );
}
