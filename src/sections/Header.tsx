"use client"

import Button from "@/components/Button";
import { ButtonProp } from "@/components/Button";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import Orbit from "@/components/Orbit";
import Logo from "@/components/Logo";

export const navItems = [
  {
    name: "Features",
    href: "#features",
  },
  {
    name: "Pricing",
    href: "#pricing",
  },
  {
    name: "Feedback",
    href: "/feedback",
  }
];

export const loginItems = [
  {
    buttonVariant: "tertiary",
    name: "Login",
    href: "/signin",
  },
  {
    buttonVariant: "primary",
    name: "Sign Up",
    href: "/signup",
  },
] satisfies {
  name: string;
  href: string;
  buttonVariant: ButtonProp['variant']
}[];

export const Header = () => {
    const [ismobileNavOpen, setismobileNavOpen ] = useState(false)
  return (
    <>
    <header className="border-b border-gray-200/20 relative z-40">
    <div className="container">
      <div className="h-18 flex justify-between items-center">
        {/* // left side div for left side content */}
        <div className="flex gap-4 items-center">
        {/* this div is for the logo */}
          <Logo />
          <div className="font-extrabold text-2xl">Friends AI</div>
        </div>

        {/* // center side div for center side content for when the laptop or tab view is there and other options are see */}
        <div className="h-full hidden lg:block">
            <nav className="h-full">
              {navItems.map(({href,name}) => (
                <a href={href}  key={href} className="h-full px-10 relative font-bold text-xs tracking-widest text-gray-400 uppercase inline-flex items-center before:content-[''] before:absolute before:bottom-0 before:h-2 before:w-px before:bg-gray-200/20 before:left-0 last:after:absolute last:after:bottom-0 last:after:h-2 last:after:w-px last:after:bg-gray-200/20 last:after:right-0">
                    {name}
                </a>
              ))}
            </nav>
        </div>

        <div className="hidden lg:flex gap-4">
          {loginItems.map(({ buttonVariant, name, href}) => (
            <a href={href} key={name}>
            <Button variant={buttonVariant}>{name}</Button>
            </a>
          ))}
        </div>

        {/* // right side div for right side content like buttons or hamburger button for small screens */}
        <div className="flex items-center lg:hidden">
        <button onClick={() => setismobileNavOpen((curr) => !curr)} className="relative size-10 rounded-lg bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400 p-0.5">
          <div className="flex items-center justify-center w-full h-full bg-gray-800 rounded-md">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={twMerge("w-4 h-0.5 bg-gray-100 -translate-y-1 transition-all duration-300 ", ismobileNavOpen && 'translate-y-0 rotate-45')}></div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={twMerge("w-4 h-0.5 bg-gray-100 translate-y-1 transition-all duration-300 ",ismobileNavOpen && 'translate-y-0 -rotate-45')}></div>
            </div>
          </div>
        </button>

        </div>
      </div>
    </div>
  </header>
  {ismobileNavOpen && (
    <div className="fixed top-18 bottom-0 right-0 left-0 bg-gray-950 z-30 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 isolate -z-10">
      <Orbit />
      </div>
      <div className="absolute-center">
      <Orbit className="size-[350px]" />
      </div>
      <div className="absolute-center">
      <Orbit className="size-[500px]" />
      </div>
      <div className="absolute-center">
      <Orbit className="size-[650px]" />
      </div>
      <div className="absolute-center">
      <Orbit className="size-[850px]" />
      </div>
      <div className="container h-full">
        <nav className="flex flex-col items-center gap-4 py-8 h-full justify-center">
          {navItems.map(({name, href}) => (
            <a href={href} key={name} className="text-gray-400 uppercase tracking-widest font-bold text-xs h-10">
                {name}
            </a>
          ))}

          {loginItems.map(({buttonVariant, href, name}) => (
            <a href={href} key={name} >
              <Button block variant={buttonVariant}>{name}</Button>
            </a>
          ))}
        </nav>
      </div>
    </div>
  )}
    </>
  )
   
};

export default Header;
