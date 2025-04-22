"use client";

import {useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react'
import { SendIcon } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import underlineImage from "@/assets/images/underline.svg?url";
import { Loader } from "@/components/Loader";
import Popup from "@/components/popup";
import { useSession } from "@/context/SessionContext";
// import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

export default function ChatPage() {
  const session = useSession();
  // const router = useRouter();
  const [ispageloader, setispageloader] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit } = useChat({ api: "/api/generate" });

  // Initial loader delay
  useEffect(() => {
    const timer = setTimeout(() => setispageloader(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ FIXED LOADER
  if (ispageloader) return <Loader />;

  // ✅ FIXED SESSION CHECK
  if (!session) return <Popup />;

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <div className="p-4 bg-gray-800 shadow-md">
        <div className="flex justify-between items-center">
          <Select defaultValue="Motivated">
            <SelectTrigger className="w-[180px]">
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
          <h2 className="text-2xl relative font-semibold">
            Friends AI
            <span
              className="absolute w-full left-0 top-full h-4 bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400"
              style={{
                maskImage: `url(${underlineImage.src})`,
                maskSize: "contain",
                maskPosition: "center",
                maskRepeat: "no-repeat",
              }}
            ></span>
          </h2>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">Start a new conversation ✨</p>
        ) : (
          messages.map((m, index) => (
            <div
              key={index}
              className={`p-4 border rounded-xl bg-gray-900 border-gray-700 ${
                m.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div className={`font-semibold ${m.role === "user" ? "text-blue-400" : "text-green-400"}`}>
                {m.role === "user" ? "You" : "Friend AI"}
              </div>
              <ReactMarkdown
                className="prose prose-invert text-sm mt-2"
                remarkPlugins={[remarkParse, remarkRehype]}
                rehypePlugins={[rehypeRaw, rehypeStringify]}
              >
                {m.content}
              </ReactMarkdown>
            </div>
          ))
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className={`w-full px-4 py-4 bg-gray-800 flex gap-4 border-t border-gray-700 transition-all duration-300 ${messages.length === 0 ? "mt-auto justify-center" : ""}`}
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded text-white font-semibold shadow-md transition"
        >
          <SendIcon className="w-5 h-5" /> Send
        </button>
      </form>
    </div>
  );
}
