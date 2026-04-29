import type { Metadata } from "next";
import ClientHomepageV2 from "./ClientHomepageV2";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Friends AI — Your agentic companion",
  description:
    "A premium multimodal companion: voice, vision, generation, and a live avatar that feels human. Built on a LangGraph-orchestrated agent stack.",
};

export default function V2Page() {
  return <ClientHomepageV2 />;
}
