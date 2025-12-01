"use client";

import { motion } from "framer-motion";
import { Settings, Moon, Sun, Trash2, Sparkles } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import Logo from "../Logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ChatNavbar() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={clsx(
        "sticky top-0 z-50 w-full px-6 py-3",
        "backdrop-blur-xl bg-white/5 dark:bg-black/40",
        "border-b border-white/10 shadow-sm",
        "flex items-center justify-between"
      )}
    >
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-4">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-semibold text-lg tracking-tight text-foreground hidden sm:block">
              Nova Chat
            </span>
          </div>
        </Link>
        <div className="h-6 w-[1px] bg-border/50 hidden sm:block" />
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                onClick={() => {
                  // Placeholder for clear chat functionality
                  window.location.reload();
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Theme</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          size="sm"
          className="ml-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
        >
          <Sparkles className="w-3 h-3 mr-2" />
          Upgrade
        </Button>
      </div>
    </motion.header>
  );
}
