import { auth, signIn } from "@/auth";
import LoginForm from "@/components/client/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FC } from "react";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Google from "@/assets/images/image.png"

const page : FC = async () => {

  const session = await auth();

  if(session?.user) redirect("/");
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
        <h2 className="flex justify-center text-2xl font-semibold text-gray-800 mb-4">Sign In</h2>
        <div className="flex flex-col gap-4">
          <LoginForm />
        </div>
        <div className="flex items-center justify-center mt-4">
          <button className="text-purple-600 font-medium">
              Don&apos;t have an Account ?
            </button>
              <Link className="ml-2 text-sm text-purple-600 font-medium hover:underline" href="/signup">
              Sign Up
              </Link>

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
                  width={40} height={40}
                  />
                <span className="text-gray hover:transition-all ease-in-out text-lg text-black">Google</span>
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
                <span className="text-gray hover:transition-all ease-in-out text-lg text-black">Github</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default page