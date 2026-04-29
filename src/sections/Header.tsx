"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { signOut } from "next-auth/react";
import Logo from "@/components/Logo";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export const navItems = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Feedback", href: "/feedback" },
];

export const Header = () => {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const session = useSession();
  const isAuthenticated = session?.data?.user;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pt-3 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex h-14 items-center justify-between bg-stone-950/80 backdrop-blur-xl border border-stone-800/50 rounded-2xl px-5 shadow-[0_1px_24px_rgba(0,0,0,0.45)]">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo />
              <span className="text-base font-semibold text-stone-100 tracking-tight group-hover:text-amber-400 transition-colors duration-300">
                Friends AI
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map(({ name, href }) => (
                <a
                  key={name}
                  href={href}
                  className="px-4 py-2 text-sm text-stone-400 hover:text-stone-100 transition-colors duration-200 rounded-xl hover:bg-stone-800/60"
                >
                  {name}
                </a>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-2.5">
              {isAuthenticated ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-stone-950 text-sm font-bold ring-2 ring-amber-500/20">
                    {session.data?.user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-4 py-1.5 text-sm text-stone-400 hover:text-stone-100 border border-stone-800 hover:border-stone-700 rounded-xl transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="px-4 py-1.5 text-sm text-stone-400 hover:text-stone-100 transition-colors duration-200 rounded-xl hover:bg-stone-800/60"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-xl border border-stone-800 bg-stone-900/50 hover:bg-stone-800 transition-all"
              aria-label="Toggle menu"
            >
              <motion.span
                animate={isMobileNavOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-[18px] h-px bg-stone-300 block"
              />
              <motion.span
                animate={isMobileNavOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="w-[18px] h-px bg-stone-300 block"
              />
              <motion.span
                animate={isMobileNavOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-[18px] h-px bg-stone-300 block"
              />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed top-[4.5rem] left-4 right-4 z-40 bg-stone-950/96 backdrop-blur-2xl border border-stone-800/60 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          >
            <nav className="flex flex-col gap-0.5">
              {navItems.map(({ name, href }) => (
                <a
                  key={name}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className="px-4 py-3 text-stone-300 hover:text-stone-100 hover:bg-stone-800/60 rounded-xl transition-colors text-sm font-medium"
                >
                  {name}
                </a>
              ))}
            </nav>
            <div className="mt-3 pt-3 border-t border-stone-800/60 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setMobileNavOpen(false); }}
                  className="px-4 py-2.5 text-stone-400 hover:text-stone-100 rounded-xl text-sm font-medium text-left transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setMobileNavOpen(false)}
                    className="px-4 py-2.5 text-stone-300 hover:text-stone-100 rounded-xl text-sm font-medium transition-colors hover:bg-stone-800/60"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileNavOpen(false)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-sm font-semibold text-center transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
