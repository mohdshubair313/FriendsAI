// components/Header.tsx
"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { signOut } from "next-auth/react";
import Orbit from "@/components/Orbit";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const navItems = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Feedback", href: "/feedback" },
];

export const loginItems: { name: string; href: string; buttonVariant: 'primary' | 'secondary' | 'tertiary' }[] = [
  { name: "Login", href: "/signin", buttonVariant: "primary" },
  { name: "Sign Up", href: "/signup", buttonVariant: "primary" },
];

export const Header = () => {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const session = useSession();
  const isAuthenticated = session?.user;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-sm border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and brand */}
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-xl font-bold text-white tracking-tight">Friends AI</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex gap-4">
              {navItems.map(({ name, href }) => (
                <a
                  key={name}
                  href={href}
                  className="px-4 py-2 text-xs uppercase tracking-widest font-bold text-gray-400 hover:text-white transition hover:scale-105 rounded-full bg-gray-950 hover:bg-gradient-to-r hover:from-amber-300 hover:via-teal-300 hover:to-fuchsia-400 hover:text-transparent hover:bg-clip-text"
                >
                  {name}
                </a>
              ))}
            </nav>

            {/* Auth buttons / Avatar */}
            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Avatar>
                    <AvatarImage />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                 className="relative px-6 py-2 rounded-xl overflow-hidden backdrop-blur-md bg-black/50 text-white group border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <span className="absolute inset-0 -z-10 transition-all duration-300 ease-in-out scale-0 group-hover:scale-100 group-hover:blur-md bg-[conic-gradient(at_top_left,_amber,teal,fuchsia,amber)] opacity-70 rounded-xl" />
              <span className="relative z-10 font-semibold tracking-wide">
                Sign Out
              </span>
            </button>

                </>
              ) : (
                loginItems.map(({ name, href, buttonVariant }) => (
                  <a key={name} href={href}>
                    <Button variant={buttonVariant}>{name}</Button>
                  </a>
                ))
              )}
            </div>

            {/* Mobile Hamburger */}
            <div className="lg:hidden">
            <button
                onClick={() => setMobileNavOpen(!isMobileNavOpen)}
                className="relative z-50 flex items-center justify-center w-12 h-12 rounded-full overflow-hidden backdrop-blur-md bg-black/30 border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.1)] group" >
                <span className="absolute inset-0 rounded-full blur-lg bg-gradient-to-br from-fuchsia-400 via-teal-300 to-amber-300 opacity-60 group-hover:opacity-90 transition-all duration-300" />

                {/* Hamburger Bars */}
                <div className="relative z-10 flex flex-col justify-center items-center gap-1 transition-all duration-300 ease-in-out">
                  <div
                    className={`w-6 h-0.5 bg-white transition-transform duration-300 ${
                      isMobileNavOpen ? "rotate-45 translate-y-1" : ""
                    }`}
                  />
                  <div
                    className={`w-6 h-0.5 bg-white transition-transform duration-300 ${
                      isMobileNavOpen ? "-rotate-45 -translate-y-1" : ""
                    }`}
                  />
                </div>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-md px-4 py-8">
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-6 text-center">
            <Orbit className="absolute top-0 left-0 right-0 mx-auto z-[-1] size-[500px]" />
            {navItems.map(({ name, href }) => (
              <a
                key={name}
                href={href}
                className="text-lg font-semibold tracking-wide text-white hover:text-amber-400 transition"
              >
                {name}
              </a>
            ))}
            {!isAuthenticated && loginItems.map(({ name, href, buttonVariant }) => (
              <a href={href} key={name}>
                <Button block variant={buttonVariant}>{name}</Button>
              </a>
            ))}
            {isAuthenticated && (
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-white hover:text-red-400 text-base font-semibold mt-4">
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
