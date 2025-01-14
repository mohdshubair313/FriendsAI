"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { sessionmethod } from "@/auth";

const SessionContext = createContext<any>(null);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Fetch session on component mount
    const fetchSession = async () => {
      try {
        const sessionData = await sessionmethod();
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

export const useSession = () => {
  return useContext(SessionContext);
};
