"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Settings, 
  History, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Sparkles,
  Zap,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "chat", label: "Agent Chat", icon: MessageSquare, href: "/chat", color: "text-indigo-400" },
  { id: "images", label: "Image Studio", icon: ImageIcon, href: "/images", color: "text-purple-400" },
  { id: "livetalk", label: "LiveTalk Avatar", icon: Video, href: "/live_talk", color: "text-cyan-400" },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Hypothetical premium check
  const isPro = true; // For demo purposes, we'll assume Pro based on previous work

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className={cn(
        "relative flex flex-col h-screen border-r border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-300 ease-in-out z-50",
        isCollapsed ? "px-3" : "px-4"
      )}
    >
      {/* Header */}
      <div className="flex items-center h-20 px-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-10 flex-shrink-0">
            <Logo className="size-full" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors"
              >
                Spherial AI
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Action: New Session */}
      <div className="mt-4 mb-8">
        <button className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95",
          isCollapsed ? "px-0" : "px-4"
        )}>
          <Plus className="size-5" />
          {!isCollapsed && <span>New Session</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">
          {!isCollapsed ? "Core Experiences" : "Core"}
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("size-5 shrink-0 transition-colors", isActive ? item.color : "group-hover:text-zinc-100")} />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-indigo-500/10 rounded-lg -z-10"
                />
              )}
            </Link>
          );
        })}

        <div className="pt-8">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">
            {!isCollapsed ? "Recent Activity" : "Recents"}
          </div>
          {/* Session Clusters (Mocked) */}
          <div className="space-y-1">
            {[
              { label: "Product Strategy AI", type: "chat" },
              { label: "Futuristic Cityscapes", type: "images" },
              { label: "Expert Consultant", type: "livetalk" }
            ].map((session, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all text-left truncate"
              >
                <History className="size-4 shrink-0" />
                {!isCollapsed && <span className="text-xs truncate">{session.label}</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer: User Profile & Pro Badge */}
      <div className="mt-auto py-6 border-t border-white/5">
        <Link 
          href="/premium"
          className={cn(
            "group flex items-center gap-3 p-3 rounded-xl transition-all overflow-hidden",
            isPro ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20" : "hover:bg-white/5"
          )}
        >
          <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shimmer">
            {session?.user?.name?.[0] || "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">{session?.user?.name || "User"}</span>
                {isPro && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-indigo-500 text-[8px] font-black uppercase tracking-tighter text-white animate-pulse">
                    <Zap className="size-2 fill-white" />
                    Pro
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 truncate">{session?.user?.email || "Free Plan"}</p>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 size-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shadow-xl z-[60]"
      >
        {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>
    </motion.aside>
  );
}
