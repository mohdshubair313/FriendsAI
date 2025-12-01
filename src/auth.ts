import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { User } from "@/models/userModel";
import { connectToDb } from "@/lib/db";
import { getSession } from "next-auth/react";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Please fill Email and Password fields");
          }

          await connectToDb();

          const user = await User.findOne({ email: credentials.email }).select("+password");

          if (!user) {
            throw new Error("Invalid Email and password");
          }

          if (!user.password) {
            throw new Error("Password not set");
          }

          const isMatch = await compare(credentials.password, user.password);

          if (!isMatch) {
            throw new Error("Invalid Password");
          }

          return {
            id: user._id.toString(),
            name: user.username,
            email: user.email,
            username: user.username,
          };
        } catch (error: any) {
          console.error("Error in CredentialsProvider", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const sessionmethod = async () => {
  try {
    const session = await getSession();
    return session;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
};