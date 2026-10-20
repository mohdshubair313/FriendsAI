import type { ReactNode } from "react";
import { Sora, Space_Grotesk } from "next/font/google";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { SessionProvider } from "@/context/SessionContext";
import MainShell from "@/components/shell/MainShell";
import { Toaster } from "@/components/ui/sonner";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

// The route group preserves URLs and isolates app dependencies from marketing.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${sora.variable} ${spaceGrotesk.variable}`}>
      <StoreProvider>
        <SessionProvider><MainShell>{children}</MainShell></SessionProvider>
      </StoreProvider>
      <Toaster theme="dark" position="top-right" closeButton richColors />
    </div>
  );
}
