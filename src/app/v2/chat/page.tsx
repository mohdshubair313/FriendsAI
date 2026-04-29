import type { Metadata } from "next";
import ClientChatV2 from "./ClientChatV2";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Friends AI — Chat",
  description:
    "The premium V2 chat surface — multimodal, streaming, agent-aware.",
};

export default function V2ChatPage() {
  return <ClientChatV2 />;
}
