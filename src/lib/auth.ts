import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { User } from "@/models/userModel";
import { connectToDb } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your-email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const ts = new Date().toISOString();
        console.log(`[Auth][${ts}] Credentials authorize called for email: ${credentials?.email}`);
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Please provide both email and password");
          }

          console.log(`[Auth][${ts}] Connecting to DB for credentials auth...`);
          const dbStart = Date.now();
          await connectToDb();
          console.log(`[Auth][${ts}] DB connected in ${Date.now() - dbStart}ms`);

          const findStart = Date.now();
          const user = await User.findOne({ email: credentials.email }).select("+password");
          console.log(`[Auth][${ts}] User lookup in ${Date.now() - findStart}ms, found=${!!user}`);

          if (!user) {
            throw new Error("No user found with that email");
          }

          if (!user.password) {
            throw new Error("Password not set for this account");
          }

          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          console.log(`[Auth][${ts}] ✅ Credentials auth success for ${credentials.email}`);
          return {
            id: user._id.toString(),
            name: user.username,
            email: user.email,
            image: user.image || undefined,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Authentication failed";
          console.error(`[Auth][${ts}] ❌ Credentials auth error:`, message);
          throw new Error(message);
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const ts = new Date().toISOString();
      console.log(`[Auth][${ts}] signIn callback: provider=${account?.provider}, email=${user.email}`);

      // Handle OAuth user creation/update
      if (account && (account.provider === "google" || account.provider === "github")) {
        try {
          console.log(`[Auth][${ts}] OAuth sign-in: connecting to DB...`);
          const dbStart = Date.now();
          await connectToDb();
          console.log(`[Auth][${ts}] DB connected in ${Date.now() - dbStart}ms`);

          const existingUser = await User.findOne({ email: user.email });
          console.log(`[Auth][${ts}] Existing user found: ${!!existingUser}`);

          if (!existingUser) {
            // Create new user for OAuth
            console.log(`[Auth][${ts}] Creating new OAuth user...`);
            await User.create({
              username: user.name || profile?.name || user.email?.split("@")[0],
              email: user.email,
              image: user.image,
              ...(account.provider === "google" ? { googleId: account.providerAccountId } : {}),
              ...(account.provider === "github" ? { githubId: account.providerAccountId } : {}),
            });
            console.log(`[Auth][${ts}] ✅ OAuth user created`);
          } else {
            // Update existing user with OAuth ID if not present
            const updateData: Record<string, string> = {};
            if (account.provider === "google" && !existingUser.googleId) {
              updateData.googleId = account.providerAccountId;
            }
            if (account.provider === "github" && !existingUser.githubId) {
              updateData.githubId = account.providerAccountId;
            }
            if (Object.keys(updateData).length > 0) {
              await User.updateOne({ email: user.email }, { $set: updateData });
              console.log(`[Auth][${ts}] Updated user with OAuth IDs:`, Object.keys(updateData));
            }
          }
        } catch (error) {
          console.error(`[Auth][${ts}] ❌ OAuth signIn error:`, error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  secret: process.env.AUTH_SECRET,
};

export const getAuthSession = () => getServerSession(authOptions);
