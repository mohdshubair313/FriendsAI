import { signIn } from "@/auth";
import { connectToDb } from "@/lib/db";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { hash } from "bcryptjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { User } from "../models/userModel";
import Image from "next/image";
import Google from "@/assets/images/image.png"

const page = () => {

  const handlesignup = async (formData: FormData) => {
    "use server";
    
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!username || !email || !password) {
      throw new Error("Please fill all the fields");
    }

    // connect to the database first !!
    await connectToDb();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await hash(password.toString(), 10);

    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    redirect("/signin");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[radial-gradient(circle_farthest-corner,var(--color-fuchsia-900)_50%,var(--color-indigo-900)_75%,transparent)]">
      <div className="w-96 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 flex flex-col items-center">
          <h1 className="grid grid-cols-1 text-2xl font-bold text-white mb-2">Welcome to Friends AI</h1>
          <p className="text-white text-sm text-center">
            Seamless Signup and Login to start Chatting with your Friend AI
          </p>
        </div>
        <div className="p-6">
          <h2 className="flex justify-center text-2xl font-semibold text-gray-800 mb-4">Sign Up</h2>
          <div className="flex flex-col gap-4">
            <form action={handlesignup}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="mb-3 w-full text-center text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="mb-3 w-full text-center text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="mb-3 w-full text-center text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button type="submit" className="w-full px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-indigo-500 hover:to-purple-500 transition">
                Sign Up
              </button>
            </form>
          </div>
          <div className="flex items-center justify-center mt-4">
            <p className="text-gray-600">Already have an account?</p>
            <Link className="ml-2 text-sm text-purple-600 font-medium hover:underline" href="/signin">
              Sign In
            </Link>
          </div>
          <div className=" mt-4 flex items-center justify-center">
            <form action={async () => {
              "use server";
              await signIn("google");
            }}>
              <button
                className="flex items-center justify-center mr-3 bg-gray-100 border border-gray-300 rounded-lg shadow-md hover:bg-gray-200 transition"
              >
                <Image
                  src={Google}
                  alt="Google"
                  className="mr-2"
                  width={40}
                  height={40}
                  />
                <span className="text-gray hover:transition-all ease-in-out text-lg text-black">Sign Up with Google</span>
              </button>
            </form>

            <form action={async () => {
              "use server";
              await signIn("github");
            }}>
              <button
                className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg shadow-md hover:bg-gray-200 transition"
              >
                <FontAwesomeIcon icon={faGithub} className="text-gray-800 mr-3 text-lg" />
                <span className="text-gray hover:transition-all ease-in-out text-lg text-black">Sign Up with GitHub</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
