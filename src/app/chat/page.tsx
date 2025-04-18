"use client";

import { useState, useEffect } from "react";
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

  const session = useSession();
  const router = useRouter();

  // Redirect to signup if not authenticated
  useEffect(() => {
    if (!session) {
      router.push("/signup");
    }
  }, [session, router]);

  // Fetch chat history on page load
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get("/api/chat-history");
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    fetchChatHistory();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setispageloader(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setisChatloading(false);
    setMessages((prev) => [
      ...prev,
      { userMessage: newMessage, botResponse: null },
    ]);

    try {
      const maxLength = 300;
      const response = await axios.post("/api/generate", {
        mood,
        userMessage: newMessage,
        maxLength: maxLength,
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

  const setMoodHandler = (value: string) => {
    setMood(value);
  };

  // Early return to show loader
  if (ispageloader) {
    return <Loader />;
  }

  return (
    <div>
      <div>
        {session ? (
          <div className="h-screen flex flex-col bg-gray-950 text-white">
            {/* Header */}
            <div className="p-4 bg-gray-800 shadow-md">
              <div className="flex justify-between items-center">
                <Select onValueChange={setMoodHandler} value={mood}>
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

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className="mb-6 p-4 border border-gray-700 rounded-lg bg-gray-900"
                >
                  {/* User Message */}
                  <div className="font-bold text-blue-400 mb-1">You:</div>
                  <div className="text-gray-300">{message.userMessage}</div>

                  {/* Divider */}
                  <hr className="my-4 border-gray-700" />

                  {/* Bot Response */}
                  <div className="font-bold text-green-400 mt-2">Friend AI:</div>
                  {message.botResponse === null ? (
                    isChatloading && <ChatLoader />
                  ) : (
                    <ReactMarkdown
                      className="prose prose-invert"
                      remarkPlugins={[remarkParse, remarkRehype]}
                      rehypePlugins={[rehypeRaw, rehypeStringify]}
                    >
                      {message.botResponse}
                    </ReactMarkdown>
                  )}
                </div>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-4 bg-gray-800 flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-3 rounded bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-purple-500"
              />
              <button
                onClick={sendMessage}
                className="ml-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded shadow-md flex items-center"
              >
                <SendIcon className="w-5 h-5 mr-2" />
                Send
              </button>
            </div>
          </div>
        ) : (
          <Popup />
        )}
      </div>
    </div>
  );
}
