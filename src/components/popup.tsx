"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const Popup = () => {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-lg transition-all duration-300">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-[90%] max-w-sm sm:max-w-md md:max-w-lg p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white/70 to-white/10 dark:from-[#1e1e1e]/70 dark:to-[#1e1e1e]/10 shadow-xl border border-white/10 text-gray-900 dark:text-white backdrop-blur-2xl"
      >
        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-xl text-white dark:text-white/70 hover:text-red-400 transition"
        >
          ✖
        </button>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
          Welcome to Friends AI
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base text-center mb-6 text-gray-700 dark:text-gray-300">
          Connect with your virtual friend 🤖! Sign in or sign up to explore personalized chats & mood-matching experiences.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6 mt-4">
          <Link href="/signin">
            <button className="w-full sm:w-auto px-6 py-2 rounded-full text-white font-medium bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 shadow-lg transition-all duration-300">
              Sign In
            </button>
          </Link>

          <Link href="/signup">
            <button className="w-full sm:w-auto px-6 py-2 rounded-full text-white font-medium bg-gradient-to-r from-pink-500 to-red-400 hover:from-pink-600 hover:to-red-500 shadow-lg transition-all duration-300">
              Sign Up
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Popup;
