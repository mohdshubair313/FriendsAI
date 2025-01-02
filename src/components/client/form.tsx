"use client"
import { toast } from "sonner"
import credentialsLogin  from "@/action/login"
import { useRouter } from "next/navigation"

const loginForm = () => {
  const router = useRouter();

    return (
        <>
        <form action={
          async (formData) => {
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;

            if(!email || !password) {
              return toast.error("Please provide email and password")
            }
            console.log("login handler --> email ", email)

            const id  = toast.loading("Signing in")

            const error = await credentialsLogin(email, password)

            if (!error) {
              toast.success("Signed In Sucessfully", {
                id: id
              });
            }
            else {
              toast.error(String(error), {
                id: id,
              });
              router.refresh();
            }
          }
        }>
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full text-center text-black px-4 py-2 border border-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <input
              name="password"
              type="password"
              placeholder="password"
              className="w-full text-center text-black px-4 py-2 border border-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <button type="submit" className="w-full px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-indigo-500 hover:to-purple-500 transition">
              Sign In
            </button>
          </form>
        </>
    )
}

export default loginForm