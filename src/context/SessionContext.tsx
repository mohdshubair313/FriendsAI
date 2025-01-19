"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { sessionmethod } from "@/auth";

import { Session as AuthSession } from "@auth/core/types";

// Use AuthSession directly instead of redefining it
const SessionContext = createContext<AuthSession | null>(null);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    // Fetch session on component mount
    const fetchSession = async () => {
      try {
        const sessionData: AuthSession | null = await sessionmethod();
        setSession(sessionData);
        console.log(sessionData);
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): AuthSession | null => {
  return useContext(SessionContext);
};
