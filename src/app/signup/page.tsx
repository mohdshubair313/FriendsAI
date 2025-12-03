// import { signup } from "@/auth";
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import Google from "@/assets/images/image.png";

const SignupPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlesignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error("Please fill all the fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    const loadingToastId = toast.loading("Creating your account...");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToastId);
        toast.error(data.message || "Failed to create account");
        return;
      }

      toast.dismiss(loadingToastId);
      toast.success("Account created successfully! Redirecting to sign in...");

      // Clear form
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Redirect to signin after a short delay
      setTimeout(() => {
        router.push("/signin");
      }, 1500);
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error("Signup error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex justify-center items-center min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-700 via-purple-700 to-indigo-900 overflow-hidden relative px-4">
      {/* Fancy Gradient Glow */}
      <div className="absolute w-96 h-96 md:w-[500px] md:h-[500px] bg-gradient-to-tr from-pink-400 via-purple-500 to-blue-500 rounded-full blur-3xl opacity-30 z-0" />

      <div className="relative z-10 w-full max-w-md bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Create an Account 🚀
        </h1>
        <p className="text-sm text-white text-center mb-6">
          Sign up to get started with your Friend AI
        </p>

        <form onSubmit={handlesignup} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-white placeholder-white bg-white/10 border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none disabled:opacity-50"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-white placeholder-white bg-white/10 border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none disabled:opacity-50"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-white placeholder-white bg-white/10 border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none disabled:opacity-50"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-white placeholder-white bg-white/10 border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white font-semibold shadow-md hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="flex items-center justify-center mt-4 text-white text-sm">
          <span>Already have an account?</span>
          <Link href="/signin" className="ml-2 font-medium hover:underline">
            Sign In
          </Link>
        </div>

        {/* Social Sign Ups */}
        <div className="mt-6 flex flex-col gap-4">
          <button
            onClick={() =>
              signIn("google", { redirect: true, callbackUrl: "/" })
            }
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-lg py-2 hover:bg-white/30 transition disabled:opacity-50"
          >
            <Image src={Google} alt="Google" width={30} height={30} />
            Continue with Google
          </button>

          <button
            onClick={() =>
              signIn("github", { redirect: true, callbackUrl: "/" })
            }
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-lg py-2 hover:bg-white/30 transition disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faGithub} className="text-white text-xl" />
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
