"use client";
import { toast } from "sonner";
import credentialsLogin from "@/action/login";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        if (!email || !password) {
          return toast.error("Please provide email and password");
        }

        const id = toast.loading("Signing in");

        const error = await credentialsLogin(email, password);

        if (!error) {
          toast.success("Signed In Successfully", { id });
        } else {
          toast.error(String(error), { id });
          router.refresh();
        }
      }}
      className="flex flex-col gap-5"
    >
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="w-full text-white placeholder-white bg-white/10 px-4 py-2 rounded-lg border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none focus:bg-white/20 transition-all duration-300"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        className="w-full text-white placeholder-white bg-white/10 px-4 py-2 rounded-lg border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none focus:bg-white/20 transition-all duration-300"
      />
      <button
        type="submit"
        className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
      >
        Sign In
      </button>
    </form>
  );
};

export default LoginForm;
