"use client";

import { motion } from "framer-motion";

export default function SidebarSkeleton() {
  return (
    <div className="w-[280px] h-screen border-r border-white/5 bg-black/40 backdrop-blur-xl px-4 flex flex-col py-6 overflow-hidden">
      {/* Logo Area */}
      <div className="flex items-center gap-3 mb-12">
        <div className="size-10 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-4 w-24 bg-white/5 rounded-full animate-pulse" />
      </div>

      {/* Button Area */}
      <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse mb-8" />

      {/* Nav Items */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="size-5 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-32 bg-white/5 rounded-full animate-pulse" />
          </div>
        ))}
      </div>

      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-white/5 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-20 bg-white/5 rounded-full animate-pulse" />
            <div className="h-2 w-16 bg-white/5 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
