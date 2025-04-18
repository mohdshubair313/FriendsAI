import { signIn } from "@/auth";
import { connectToDb } from "@/lib/db";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { hash } from "bcryptjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { User } from "../models/userModel";
import Google from "@/assets/images/image.png";

const page = () => {
  const handlesignup = async (formData: FormData) => {
    "use server";

    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!username || !email || !password) {
      throw new Error("Please fill all the fields");
    }

    await connectToDb();
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await hash(password.toString(), 10);

    await User.create({ username, email, password: hashedPassword });
    redirect("/signin");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-700 via-purple-700 to-indigo-900 overflow-hidden relative px-4">
      {/* Fancy Gradient Glow */}
      <div className="absolute w-96 h-96 md:w-[500px] md:h-[500px] bg-gradient-to-tr from-pink-400 via-purple-500 to-blue-500 rounded-full blur-3xl opacity-30 z-0" />

      <div className="relative z-10 w-full max-w-md bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Create an Account 🚀</h1>
        <p className="text-sm text-white text-center mb-6">
          Sign up to get started with your Friend AI
        </p>

        <form action={handlesignup} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="px-4 py-2 rounded-lg text-white placeholder-white bg-white/10 border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="px-4 py-2 rounded-lg text-white placeholder-white bg-white/10 border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="px-4 py-2 rounded-lg text-white placeholder-white bg-white/10 border border-white/30 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
          />
          <button
            type="submit"
            className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white font-semibold shadow-md hover:from-pink-600 hover:to-purple-700 transition"
          >
            Sign Up
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
          <form action={async () => { "use server"; await signIn("google"); }}>
          <button className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-lg py-2 hover:bg-white/30 transition">
            <Image src={Google} alt="Google" width={30} height={30} />
            Continue with Google
          </button>
          </form>

          <form action={async () => { "use server"; await signIn("github"); }}>
            <button className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-lg py-2 hover:bg-white/30 transition">
              <FontAwesomeIcon icon={faGithub} width={30} height={30} className="text-gray text-xl" />
              Continue with GitHub
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default page;
