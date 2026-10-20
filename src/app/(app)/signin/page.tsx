export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { FC } from "react";
import SignInForm from "@/components/client/form";
import SocialLogin from "@/components/client/SocialLogin";
import { getAuthSession } from "@/lib/auth";
import Logo from "@/components/Logo";

const SignInPage: FC = async () => {
  const session = await getAuthSession();
  if (session?.user) redirect("/chat");

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient warm glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(120,53,15,0.25)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(80,40,10,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-10 group">
          <Logo className="size-10" />
          <span className="text-xl font-semibold text-stone-100 group-hover:text-amber-400 transition-colors">
            Friends AI
          </span>
        </Link>

        {/* Card */}
        <div className="bg-stone-900/60 backdrop-blur-xl border border-stone-800/60 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          <h1 className="text-2xl font-semibold text-stone-100 mb-1.5">Welcome back</h1>
          <p className="text-sm text-stone-500 mb-7">Sign in to continue to Friends AI</p>

          <SignInForm />

          <SocialLogin />

          <p className="text-center text-sm text-stone-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
