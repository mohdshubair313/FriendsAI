"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { FC, ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * App-wide NextAuth session provider.
 *
 * Defaults are tuned to AVOID the "session refetch every 1-2s" log spam:
 *   - refetchInterval: 0           → no background polling
 *   - refetchOnWindowFocus: false  → don't refetch on every alt-tab
 *
 * The session is still refreshed naturally when:
 *   - The user signs in / out
 *   - A page reload happens
 *   - You explicitly call `update()` from useSession()
 *
 * For most apps this is more than enough — the JWT is good for the lifetime
 * of the browser tab, and pages that genuinely need fresh data should call
 * `update()` themselves at the right moment.
 */
export const SessionProvider: FC<SessionProviderProps> = ({ children }) => {
  return (
    <NextAuthSessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
};

export { useSession, signIn, signOut } from "next-auth/react";
