"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const Popup = () => {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="popup-wrapper"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-[2px] transition-all duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          key="popup"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-[90%] max-w-md md:max-w-xl rounded-3xl p-8 sm:p-10 border border-white/10 bg-[#1a1a1a]/80 shadow-[0_0_40px_rgba(255,255,255,0.07)] text-white"
        >
          {/* Background Floating Glow */}
          <div className="absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(255,0,150,0.2),transparent_70%)]" />
          <div className="absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(circle_at_bottom_right,_rgba(0,255,255,0.2),transparent_70%)]" />

          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 text-white text-xl hover:scale-110 hover:text-red-500 transition-all"
            aria-label="Close"
          >
            ✖
          </button>

          {/* Header */}
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 bg-gradient-to-r from-fuchsia-400 via-violet-400 to-blue-400 text-transparent bg-clip-text drop-shadow-lg">
            ✨ Friends AI Awaits You
          </h2>

          <p className="text-center text-sm md:text-base text-gray-300 mb-6 leading-relaxed">
            Step into conversations that understand your vibes. Sign in or sign up to meet your personal AI companion.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-6">
            <Link href="/signin">
              <button className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#7dd3fc] text-white font-semibold shadow-lg hover:shadow-[0_0_20px_#a78bfa] hover:scale-105 transition-all">
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#fb7185] to-[#facc15] text-white font-semibold shadow-lg hover:shadow-[0_0_20px_#fb7185] hover:scale-105 transition-all">
                Sign Up
              </button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Popup;
