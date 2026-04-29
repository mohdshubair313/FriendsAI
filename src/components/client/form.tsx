"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const SignInForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");

    setIsLoading(true);
    const toastId = toast.loading("Signing in...");

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        toast.error("Invalid email or password", { id: toastId });
      } else if (result?.ok) {
        toast.success("Welcome back!", { id: toastId });
        router.push("/chat");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          className="w-full pl-10 pr-4 py-3 bg-stone-800/60 border border-stone-700/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-stone-100 placeholder-stone-500 rounded-xl outline-none transition-all duration-200 text-sm disabled:opacity-50"
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
};

export default SignInForm;
