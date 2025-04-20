"use client";

import { cva } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { HTMLAttributes } from "react";

export type ButtonProp = {
  variant?: "primary" | "secondary" | "tertiary";
  block?: boolean;
  disabled?: boolean;
} & HTMLAttributes<HTMLButtonElement>;

const classes = cva(
  "group relative grid overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold shadow-[0_1000px_0_0_hsl(0_0%_85%)_inset] dark:shadow-[0_1000px_0_0_hsl(0_0%_15%)_inset] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      block: {
        true: "w-full",
      },
      variant: {
        primary:
          "bg-neutral-100/80 backdrop-blur-md hover:bg-neutral-200/90 dark:bg-neutral-950/70 dark:hover:bg-neutral-900/70 text-neutral-700 dark:text-neutral-300",
        secondary:
          "bg-[#1a1e25] text-white border border-white/10 hover:border-blue-400 hover:scale-105",
        tertiary:
          "bg-transparent text-white border border-white/20 hover:bg-white/10 hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "primary",
      block: false,
    },
  }
);

const Button = ({
  variant = "primary",
  block,
  children,
  ...otherprops
}: ButtonProp) => {
  const router = useRouter();

  const gotochat = () => {
    if (variant === "secondary") {
      router.push("/chat");
    }
  };

  return (
    <button
      className={classes({ variant, block })}
      onClick={gotochat}
      {...otherprops}
    >
      {/* Spark Layer */}
      <span>
        <span
          className="spark mask-gradient absolute inset-0 h-full w-full animate-flip overflow-hidden rounded-xl [mask:linear-gradient(black,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:bg-[conic-gradient(from_0deg,transparent_0_340deg,black_360deg)] dark:before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%] dark:[mask:linear-gradient(white,_transparent_50%)] before:animate-rotate"
        />
      </span>

      {/* Blurred Background */}
      <span className="backdrop absolute inset-px rounded-[11px] transition-colors duration-300 group-hover:bg-neutral-200/90 dark:group-hover:bg-neutral-900/70" />

      {/* Button Label */}
      <span className="z-10 text-neutral-700 dark:text-neutral-300">{children}</span>
    </button>
  );
};

export default Button;