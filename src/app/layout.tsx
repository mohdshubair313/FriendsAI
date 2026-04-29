import type { Metadata } from "next";
import { Sora, Space_Grotesk, Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/context/SessionContext";
import { Analytics } from '@vercel/analytics/next';
import { StoreProvider } from "@/components/providers/StoreProvider";
import MainShell from "@/components/shell/MainShell";

const soraFont = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: "variable",
});
const spaceGroteskFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: "variable",
});
const geistFont = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const instrumentSerifFont = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Friends AI — Your agentic companion for thinking, creating, and being heard",
  description: "Friends AI is a premium multimodal companion: voice, vision, generation, and a live avatar that feels human. Built on a LangGraph-orchestrated agent stack.",
  metadataBase: new URL("https://friends.ai"),
  openGraph: {
    title: "Friends AI",
    description: "A premium agentic companion. Voice. Vision. Live avatar.",
    type: "website",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${soraFont.variable} ${spaceGroteskFont.variable} ${geistFont.variable} ${instrumentSerifFont.variable} antialiased bg-black text-zinc-100 font-sans overflow-x-hidden`}
      >
        <StoreProvider>
          <SessionProvider>
            <MainShell>
              {children}
            </MainShell>
          </SessionProvider>
        </StoreProvider>
        <Analytics />
        <Toaster theme="dark" position="top-right" closeButton richColors />
      </body>
    </html>
  );
}
