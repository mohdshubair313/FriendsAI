"use client";

import { useState } from "react";
import Link from "next/link";

const Popup = () => {
  const [isVisible, setIsVisible] = useState(true);

  const closePopup = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-xl w-[90%] max-w-md">
        
      <button
          onClick={closePopup}
          className="absolute top-3 right-3 text-xl text-white hover:text-gray-300 transition"
        >
          ✖
        </button>
        <h2 className="text-2xl font-bold mb-3">Welcome to Friends AI</h2>
        <p className="text-sm mb-6">
          Connect with your virtual friend! Sign up or Sign in to explore personalized conversations and mood-matching interactions.
        </p>
        <div className="flex justify-between">
          <Link href="/signin">
          <button className="bg-white text-purple-700 px-4 py-2 rounded-full shadow hover:bg-gray-100 transition">
            Sign In
          </button>
          </Link>
          <Link href="/signup">
            <button className="bg-white text-pink-700 px-4 py-2 rounded-full shadow hover:bg-gray-100 transition">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Popup;
