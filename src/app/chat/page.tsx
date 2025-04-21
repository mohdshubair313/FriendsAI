"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SendIcon } from "lucide-react";
import underlineImage from "@/assets/images/underline.svg?url";
import { Loader } from "@/components/Loader";
import ChatLoader from "./ChatLoader";
import Popup from "@/components/popup";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [mood, setMood] = useState("Motivated");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<
    { userMessage: string; botResponse: string | null }[]
  >([]);
  const [isChatloading, setisChatloading] = useState(false);
  const [ispageloader, setispageloader] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) router.push("/signup");
  }, [session, router]);

  useEffect(() => {
    const timer = setTimeout(() => setispageloader(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setisChatloading(false);
    setMessages((prev) => [...prev, { userMessage: newMessage, botResponse: null }]);

    try {
      const response = await axios.post("/api/generate", {
        mood,
        userMessage: newMessage,
        maxLength: 300,
      });

      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, botResponse: response.data.botResponse }
            : msg
        )
      );
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, botResponse: "Something went wrong. Please try again." }
            : msg
        )
      );
    } finally {
      setisChatloading(true);
    }

    setNewMessage("");
  };

  if (ispageloader) return <Loader />;
  if (!session) return <Popup />;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      <header className="p-4 bg-gradient-to-r from-purple-800 via-fuchsia-600 to-pink-500 shadow-lg z-10">
        <div className="flex justify-between items-center container mx-auto">
          <Select onValueChange={(val) => setMood(val)} value={mood}>
            <SelectTrigger className="w-[180px] bg-black/30 text-white border border-white/20">
              <SelectValue placeholder="Select a Mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Moods</SelectLabel>
                <SelectItem value="Motivated">Motivated 😤</SelectItem>
                <SelectItem value="Excited">Excited 🤩</SelectItem>
                <SelectItem value="Lover">Lover 🥰</SelectItem>
                <SelectItem value="Friendly">Friendly 🤗</SelectItem>
                <SelectItem value="Supportive">Supportive 🤝</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <h1 className="text-3xl font-extrabold relative text-white">
            Friends AI
            <span
              className="absolute w-full left-0 top-full h-3 bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400"
              style={{
                maskImage: `url(${underlineImage.src})`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            ></span>
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 container mx-auto space-y-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20 animate-fade-in">
            <p className="text-lg">Start chatting with your AI friend ✨</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-xl mx-auto p-5 rounded-2xl shadow-md transition-all duration-300 animate-fade-in backdrop-blur-lg bg-black/30 border border-white/10 ${
                msg.botResponse ? "space-y-4" : ""
              }`}
            >
              <div className="text-blue-300 font-medium">You:</div>
              <div className="text-gray-100 text-base">{msg.userMessage}</div>

              {msg.botResponse && (
                <>
                  <hr className="border-white/10 my-3" />
                  <div className="text-green-300 font-medium">Friend AI:</div>
                  <ReactMarkdown
                    className="prose prose-invert text-sm"
                    remarkPlugins={[remarkParse, remarkRehype]}
                    rehypePlugins={[rehypeRaw, rehypeStringify]}
                  >
                    {msg.botResponse}
                  </ReactMarkdown>
                </>
              )}

              {!msg.botResponse && !isChatloading && (
                <ChatLoader />
              )}
            </div>
          ))
        )}
        <div ref={bottomRef}></div>
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className={`w-full px-6 py-4 bg-black/80 border-t border-white/10 backdrop-blur-md flex items-center gap-4 transition-all duration-300 ${
          messages.length === 0 ? "justify-center mt-auto" : ""
        }`}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 p-3 rounded-lg bg-white/10 text-white placeholder:text-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium shadow-md"
        >
          <SendIcon className="w-5 h-5" /> Send
        </button>
      </form>
    </div>
  );
}
