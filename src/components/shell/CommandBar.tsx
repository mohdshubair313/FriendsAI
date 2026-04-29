"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Command,
  ArrowRight,
  Zap,
  Globe,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Handle shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleAction = useCallback((href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery("");
  }, [router]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-zinc-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass"
            >
              {/* Search Input */}
              <div className="flex items-center px-4 py-4 border-b border-white/5">
                <Search className="size-5 text-zinc-500 mr-3" />
                <input
                  autoFocus
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setIsOpen(false);
                  }}
                />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400">
                  ESC
                </div>
              </div>

              {/* Actions List */}
              <div className="p-2 max-h-[400px] overflow-y-auto no-scrollbar">
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Quick Actions
                </div>
                
                <CommandItem 
                  icon={MessageSquare} 
                  label="Start New Chat Session" 
                  shortcut="C"
                  onClick={() => handleAction("/chat")} 
                />
                <CommandItem 
                  icon={ImageIcon} 
                  label="Open Image Generation Studio" 
                  shortcut="I"
                  onClick={() => handleAction("/images")} 
                />
                <CommandItem 
                  icon={Video} 
                  label="Initialize LiveTalk Avatar" 
                  shortcut="L"
                  onClick={() => handleAction("/live_talk")} 
                />
                
                <div className="mt-4 px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Utility
                </div>
                <CommandItem 
                  icon={Zap} 
                  label="Upgrade to Pro Plan" 
                  onClick={() => handleAction("/premium")} 
                />
                <CommandItem 
                  icon={Globe} 
                  label="Community Showcase" 
                  onClick={() => handleAction("/showcase")} 
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <Command className="size-3" /> <ArrowRight className="size-3" /> <span className="font-bold">Select</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-bold font-sans">Tab</kbd> <span className="font-bold">Navigate</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-400">Spherial Intelligence v2.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Trigger (Subtle) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all z-[90] group shadow-2xl"
      >
        <Command className="size-4 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-medium tracking-tight">Press <kbd className="mx-1 font-sans font-bold">⌘K</kbd> to explore</span>
      </button>
    </>
  );
}

function CommandItem({ icon: Icon, label, shortcut, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/10 transition-all group text-left"
    >
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
          <Icon className="size-5" />
        </div>
        <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{label}</span>
      </div>
      {shortcut && (
        <div className="px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[10px] font-bold text-zinc-500">
          {shortcut}
        </div>
      )}
    </button>
  );
}
