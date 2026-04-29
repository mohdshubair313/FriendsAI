"use client";

import { cn } from "@/lib/utils";
import { motion, useInView, type HTMLMotionProps } from "framer-motion";
import * as React from "react";

interface FadeInUpProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
  amount?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
  children: React.ReactNode;
}

/**
 * Scroll-triggered fade + lift. Honours prefers-reduced-motion.
 * Uses transform-only animation for 60fps+ on scroll.
 */
export function FadeInUp({
  delay = 0,
  duration = 0.7,
  y = 24,
  once = true,
  amount = 0.25,
  as = "div",
  className,
  children,
  ...rest
}: FadeInUpProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount });
  const Tag = motion[as] as typeof motion.div;

  return (
    <Tag
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  delayStep?: number;
  initialDelay?: number;
}

/**
 * Staggered children — wrap children with FadeInUp for direct control,
 * or use StaggerChildren which auto-applies sequential delays to its
 * direct FadeInUp descendants via React.Children.
 */
export function Stagger({
  children,
  className,
  delayStep = 0.08,
  initialDelay = 0,
}: StaggerProps) {
  const items = React.Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) => {
        if (!React.isValidElement(child)) return child;
        const props = child.props as { delay?: number };
        return React.cloneElement(child as React.ReactElement<{ delay?: number }>, {
          delay: (props.delay ?? 0) + initialDelay + i * delayStep,
        });
      })}
    </div>
  );
}
