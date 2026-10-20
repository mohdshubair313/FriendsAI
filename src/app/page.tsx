
import type { Metadata } from "next";
import HomepageV2 from "./v2/ClientHomepageV2";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Friends AI — Your agentic companion",
  description: "A companion for everyday conversations, fresh ideas, and thinking things through. Start chatting for free, or explore voice and image creation with Pro.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Friends AI — Your agentic companion",
    description: "Think out loud. Create something new. Find a little space for you.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return <HomepageV2 />;
}
