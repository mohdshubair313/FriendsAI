import React from "react";
import {
  faXTwitter,
  faLinkedin,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import Logo from "@/components/Logo";

export const navItems = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Sign In", href: "/signin" },
  { name: "Feedback", href: "/feedback" },
];

export const socialLinks = [
  { name: "Github", icon: faGithub, href: "https://github.com/mohdshubair313" },
  { name: "X", icon: faXTwitter, href: "https://x.com/shubair313/" },
  { name: "LinkedIn", icon: faLinkedin, href: "https://www.linkedin.com/in/mohd-shubair-b1a454250/" },
];

export const Footer = () => {
  return (
    <footer className="border-t border-stone-800/40 bg-stone-950/80">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-base font-semibold text-stone-100">Friends AI</span>
            </div>
            <p className="text-stone-500 text-sm max-w-[200px] leading-relaxed">
              Your mood-aware AI companion. Always by your side.
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-stone-500 hover:text-amber-400 transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Social */}
          <div className="flex gap-2.5">
            {socialLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-amber-500/15 border border-stone-800 hover:border-amber-500/40 flex items-center justify-center transition-all duration-200 group"
                aria-label={link.name}
              >
                <FontAwesomeIcon
                  icon={link.icon}
                  className="text-stone-500 group-hover:text-amber-400 transition-colors text-sm"
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-stone-600 text-xs">
            © 2025 Friends AI — Built with care by{" "}
            <span className="text-stone-400">Shubair</span>. All rights reserved.
          </p>
          <Link
            href="#"
            className="text-stone-600 hover:text-amber-400 text-xs transition-colors"
          >
            Back to top ↑
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
