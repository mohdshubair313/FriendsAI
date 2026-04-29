"use client";

import { motion } from "framer-motion";
import { Sparkles, Crown } from "lucide-react";
import Link from "next/link";
import Logo from "../Logo";

interface ChatNavbarProps {
  isPremium?: boolean;
}

export default function ChatNavbar({ isPremium = false }: ChatNavbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full px-4 py-3 backdrop-blur-xl bg-stone-950/80 border-b border-stone-800/60 flex items-center justify-between"
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group">
          <Logo className="w-8 h-8" />
          <span className="font-semibold text-base tracking-tight text-stone-100 group-hover:text-amber-400 transition-colors hidden sm:block">
            Friends AI
          </span>
        </Link>

        <div className="hidden sm:block h-5 w-px bg-stone-800" />

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-stone-800/60 border border-stone-700/40">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          <span className="text-xs font-medium text-stone-400">Online</span>
        </div>
      </div>

      {/* Right: Premium badge or upgrade */}
      <div className="flex items-center gap-2">
        {isPremium ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-medium">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        ) : (
          <Link
            href="/#pricing"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-all duration-200 hover:shadow-[0_0_16px_rgba(245,158,11,0.35)]"
          >
            <Sparkles className="w-3 h-3" />
            Upgrade
          </Link>
        )}
      </div>
    </motion.header>
  );
}
