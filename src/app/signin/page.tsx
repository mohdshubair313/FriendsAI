import Link from "next/link";
import { redirect } from "next/navigation";
import { FC } from "react";
import SignInForm from "@/components/client/form";
import SocialLogin from "@/components/client/SocialLogin";
import { getAuthSession } from "@/lib/auth";

const SignInPage: FC = async () => {
  const session = await getAuthSession();
  if (session?.user) redirect("/");

  return (
    <div className="flex justify-center items-center min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-700 via-purple-700 to-indigo-900 overflow-hidden relative px-4">
      {/* Glow ring effect */}
      <div className="absolute w-96 h-96 md:w-[500px] md:h-[500px] bg-gradient-to-tr from-pink-400 via-purple-500 to-blue-500 rounded-full blur-3xl opacity-30 z-0" />

      <div className="relative z-10 w-full max-w-md bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Welcome Back 👋
        </h1>
        <p className="text-sm text-white text-center mb-6">
          Seamless Sign In to start chatting with Friend AI
        </p>

        <SignInForm />

        <div className="flex items-center justify-center mt-4 text-white">
          <span>Do not have an account?</span>
          <Link href="/signup" className="ml-2 text-purple-200 hover:underline">
            Sign Up
          </Link>
        </div>

        {/* Social Logins */}
        <SocialLogin />
      </div>
    </div>
  );
};

export default SignInPage;
