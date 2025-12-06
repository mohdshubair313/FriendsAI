"use client";

import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { signIn } from "next-auth/react";
import Google from "@/assets/images/image.png";

const SocialLogin = () => {
    return (
        <div className="mt-6 flex flex-col gap-4">
            <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-lg py-2 hover:bg-white/30 transition-all duration-300 hover:scale-[1.02]"
            >
                <Image src={Google} alt="Google" width={26} height={26} />
                <span className="text-sm">Continue with Google</span>
            </button>

            <button
                onClick={() => signIn("github", { callbackUrl: "/" })}
                className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-lg py-2 hover:bg-white/30 transition-all duration-300 hover:scale-[1.02]"
            >
                <FontAwesomeIcon icon={faGithub} width={26} height={26} />
                <span className="text-sm">Continue with GitHub</span>
            </button>
        </div>
    );
};

export default SocialLogin;
