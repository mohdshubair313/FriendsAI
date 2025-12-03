"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { sessionmethod } from "@/lib/auth";
import { Session } from "next-auth";

const SessionContext = createContext<Session | null>(null);

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await sessionmethod();
        setSession(sessionData);
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

export const useSession = () => {
  return useContext(SessionContext);
};
