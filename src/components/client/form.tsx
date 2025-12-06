"use client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

const LoginForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setIsLoading(false);
      return toast.error("Please provide email and password");
    }

    const toastId = toast.loading("Signing in...");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error, { id: toastId });
      } else if (result?.ok) {
        toast.success("Signed In Successfully", { id: toastId });
        router.refresh();
        router.push("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <input
        name="email"
        type="email"
        placeholder="Email"
        disabled={isLoading}
        className="w-full text-white placeholder-white bg-white/10 px-4 py-2 rounded-lg border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none focus:bg-white/20 transition-all duration-300 disabled:opacity-50"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        disabled={isLoading}
        className="w-full text-white placeholder-white bg-white/10 px-4 py-2 rounded-lg border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none focus:bg-white/20 transition-all duration-300 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
};

export default LoginForm;
