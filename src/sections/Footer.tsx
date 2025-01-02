import React from "react";
import {
  faXTwitter,
  faLinkedin,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

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
    name: "Login",
    href: "/signin",
  },
  {
    name: "Feedback",
    href: "/feedback",
  }
];

export const socialLinks = [
  {
    name: "Github",
    icon: faGithub,
    href: "https://github.com/mohdshubair313",
  },
  {
    name: "X",
    icon: faXTwitter,
    href: "https://x.com/shubair313/",
  },
  {
    name: "LinkedIn",
    icon: faLinkedin,
    href: "https://www.linkedin.com/in/mohd-shubair-b1a454250/",
  },
];

export const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-200 py-10">
      <hr className="border-slate-800 mb-7" />
      <div className="container mx-auto px-4">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo/Brand */}
          <div className="text-2xl font-extrabold tracking-wider text-gray-50">
            Friends AI
          </div>

          {/* Navigation */}
          <nav className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="uppercase text-sm font-medium tracking-wide hover:text-teal-400 transition duration-300"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Social Links */}
        <div className="mt-8 flex justify-center gap-4">
          {socialLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="bg-gray-950 p-3 rounded-full hover:bg-teal-400 transition duration-300"
            >
              <FontAwesomeIcon icon={link.icon} className="text-xl" />
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-8 border-t border-gray-950"></div>

        {/* Bottom Section */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center text-sm">
            © Brought to life by{" "}
            <span className="font-semibold text-teal-400">Shubair</span> and{" "}
            <span className="font-semibold text-purple-400">Friends AI</span>{" "}
            <FontAwesomeIcon icon={faHeart} className="text-red-500 mx-1" />
            🤖 | Where innovation meets connection. All rights reserved—stay curious, stay inspired.
         </p>

          {/* Optional Back-to-Top Button */}
          <Link
            href="#"
            className="text-teal-400 text-sm hover:underline hover:text-teal-300"
          >
            Back to top ↑
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
