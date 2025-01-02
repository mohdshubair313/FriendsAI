import { compare } from "bcryptjs"
import NextAuth, { CredentialsSignin } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { User} from "./app/models/userModel"
import { connectToDb } from "./lib/utils"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    Github({
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            email: { label: "email", type: "email" },
            password: { label: "password", type: "password" },
        },
        authorize: async (credentials) => {
           try {
            const email = credentials?.email as string
            const password = credentials?.password as string

            if (!email || !password) {
                throw new CredentialsSignin("Please fill Email and Password fields")
            }

            // connection with database
            await connectToDb();

            const user = await User.findOne({email}).select("+password")

            if (!user) {
                throw new CredentialsSignin({cause: "Invalid Email and password"}) 
            }

            if(!user.password) {
                throw new CredentialsSignin({cause: "Password not set"})
            }  
            
            const isMatch = await compare(password, user.password )

            if (!isMatch) {
                throw new CredentialsSignin({cause: "Invalid Password"})
            }

            return {
                username: user.username,
                email: user.email,
                id: user._id,
            }
           } catch (error) {
            console.error("Error in CredentialsProvider", error)
            throw error;
           }
        },
    })
  ],
  pages: {
    signIn: "/signin",
  },
})