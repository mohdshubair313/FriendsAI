"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import SidebarSkeleton from "./SidebarSkeleton";
import CommandBar from "./CommandBar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface MainShellProps {
  children: ReactNode;
}

export default function MainShell({ children }: MainShellProps) {
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();

  // /v2 — premium landing revamp opts out of the app shell entirely so the
  // page can scroll on the window directly (required for scroll-linked anim).
  if (pathname?.startsWith("/v2")) {
    return <>{children}</>;
  }

  // Public paths where sidebar should never show
  const isPublicPath = pathname === "/signin" || pathname === "/signup" || pathname === "/";
  
  const isAuthenticated = sessionStatus === "authenticated";
  const isLoading = sessionStatus === "loading";
  
  const showSidebar = isAuthenticated && !isPublicPath;
  const showSkeleton = isLoading && !isPublicPath;

  return (
    <div className="flex h-screen w-full bg-[#020202] text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {showSidebar ? (
          <Sidebar key="sidebar" />
        ) : showSkeleton ? (
          <SidebarSkeleton key="skeleton" />
        ) : null}
      </AnimatePresence>
      
      <main className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Command Bar is globally accessible for authenticated users */}
        {showSidebar && <CommandBar />}
        
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <AnimatePresence initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
