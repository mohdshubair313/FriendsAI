"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import Google from "@/assets/images/image.png";
import Logo from "@/components/Logo";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { signupSchema } from "@/lib/schemas";

const SignupPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    const parsed = signupSchema.safeParse({
      username: form.username,
      email: form.email,
      password: form.password,
    });

    if (!parsed.success) {
      return toast.error(parsed.error.errors[0]?.message ?? "Invalid input");
    }

    setIsLoading(true);
    const toastId = toast.loading("Creating your account...");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Failed to create account", { id: toastId });
        return;
      }

      toast.success("Account created! Redirecting to sign in...", { id: toastId });
      setForm({ username: "", email: "", password: "", confirmPassword: "" });
      setTimeout(() => router.push("/signin"), 1200);
    } catch {
      toast.error("An error occurred. Please try again.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(120,53,15,0.25)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(80,40,10,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-10 group">
          <Logo className="size-10" />
          <span className="text-xl font-semibold text-stone-100 group-hover:text-amber-400 transition-colors">
            Friends AI
          </span>
        </Link>

        <div className="bg-stone-900/60 backdrop-blur-xl border border-stone-800/60 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          <h1 className="text-2xl font-semibold text-stone-100 mb-1.5">Create your account</h1>
          <p className="text-sm text-stone-500 mb-7">Join Friends AI — it&apos;s free to start</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
              <input
                name="username"
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full pl-10 pr-4 py-3 bg-stone-800/60 border border-stone-700/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-stone-100 placeholder-stone-500 rounded-xl outline-none transition-all duration-200 text-sm disabled:opacity-50"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full pl-10 pr-4 py-3 bg-stone-800/60 border border-stone-700/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-stone-100 placeholder-stone-500 rounded-xl outline-none transition-all duration-200 text-sm disabled:opacity-50"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password (min. 6 characters)"
                value={form.password}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full pl-10 pr-11 py-3 bg-stone-800/60 border border-stone-700/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-stone-100 placeholder-stone-500 rounded-xl outline-none transition-all duration-200 text-sm disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full pl-10 pr-4 py-3 bg-stone-800/60 border border-stone-700/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-stone-100 placeholder-stone-500 rounded-xl outline-none transition-all duration-200 text-sm disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-3">
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-800" />
              <span className="text-xs text-stone-600 shrink-0">or continue with</span>
              <div className="flex-1 h-px bg-stone-800" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => signIn("google", { callbackUrl: "/chat" })}
                disabled={isLoading}
                className="flex items-center justify-center gap-2.5 bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/50 text-stone-300 hover:text-stone-100 rounded-xl py-2.5 transition-all duration-200 text-sm font-medium disabled:opacity-50"
              >
                <Image src={Google} alt="Google" width={18} height={18} />
                Google
              </button>
              <button
                onClick={() => signIn("github", { callbackUrl: "/chat" })}
                disabled={isLoading}
                className="flex items-center justify-center gap-2.5 bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/50 text-stone-300 hover:text-stone-100 rounded-xl py-2.5 transition-all duration-200 text-sm font-medium disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faGithub} className="text-base" />
                GitHub
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-stone-500 mt-6">
            Already have an account?{" "}
            <Link href="/signin" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
