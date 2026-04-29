"use client";

import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { signIn } from "next-auth/react";
import Google from "@/assets/images/image.png";

const SocialLogin = () => {
  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-800" />
        <span className="text-xs text-stone-600 shrink-0">or continue with</span>
        <div className="flex-1 h-px bg-stone-800" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => signIn("google", { callbackUrl: "/chat" })}
          className="flex items-center justify-center gap-2.5 bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/50 hover:border-stone-600/60 text-stone-300 hover:text-stone-100 rounded-xl py-2.5 transition-all duration-200 text-sm font-medium"
        >
          <Image src={Google} alt="Google" width={18} height={18} />
          Google
        </button>

        <button
          onClick={() => signIn("github", { callbackUrl: "/chat" })}
          className="flex items-center justify-center gap-2.5 bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/50 hover:border-stone-600/60 text-stone-300 hover:text-stone-100 rounded-xl py-2.5 transition-all duration-200 text-sm font-medium"
        >
          <FontAwesomeIcon icon={faGithub} className="text-base" />
          GitHub
        </button>
      </div>
    </div>
  );
};

export default SocialLogin;
