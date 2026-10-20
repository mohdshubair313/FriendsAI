"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
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
  const { status: sessionStatus } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mobileNavOpen) return;
    const trigger = triggerRef.current;
    navRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
      if (event.key !== "Tab") return;
      const items = navRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); trigger?.focus(); };
  }, [mobileNavOpen]);

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
    <div className="flex h-dvh w-full bg-[#020202] text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {showSidebar ? (
          <div key="sidebar" ref={navRef}
            role={mobileNavOpen ? "dialog" : undefined} aria-modal={mobileNavOpen || undefined}
            aria-label={mobileNavOpen ? "App navigation" : undefined}
            onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMobileNavOpen(false); }}
            className={mobileNavOpen ? "fixed inset-0 z-[110] md:relative md:inset-auto md:z-50" : "hidden md:block"}>
            {mobileNavOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/70 md:hidden"><X className="absolute right-4 top-4 size-6" /></button>}
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        ) : showSkeleton ? (
          <div key="skeleton" className="hidden md:block"><SidebarSkeleton /></div>
        ) : null}
      </AnimatePresence>
      {showSidebar && <button ref={triggerRef} type="button" aria-label="Open navigation"
        aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}
        className="fixed left-3 top-2.5 z-[60] rounded-lg bg-zinc-900 p-2 text-zinc-200 md:hidden">
        <Menu className="size-4" />
      </button>}
      
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
