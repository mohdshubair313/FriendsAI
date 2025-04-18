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
                    className="relative px-6 py-2 rounded-md bg-black text-white group hover:bg-transparent"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400 rounded-md -z-10 transition-transform scale-0 group-hover:scale-100"></span>
                    Sign Out
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
                className="p-2 rounded-md bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400"
              >
                <div className="w-6 h-0.5 bg-black mb-1 transition-transform duration-300 transform origin-center" style={{ transform: isMobileNavOpen ? "rotate(45deg) translateY(0.25rem)" : "none" }} />
                <div className="w-6 h-0.5 bg-black transition-transform duration-300 transform origin-center" style={{ transform: isMobileNavOpen ? "rotate(-45deg) translateY(-0.25rem)" : "none" }} />
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
