import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
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
        className={`${geistFont.variable} ${instrumentSerifFont.variable} antialiased bg-black text-zinc-100 font-sans overflow-x-hidden`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
