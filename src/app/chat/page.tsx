"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SendIcon } from "lucide-react";
import underlineImage from "@/assets/images/underline.svg?url";
import Loader from "@/components/Loader"
import ChatLoader from "./ChatLoader";


export default function ChatPage({user}:{user:any}) {
  const [mood, setMood] = useState("Motivated");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<{ userMessage: string; botResponse: any }[]>([]);
  const [isChatloading, setisChatloading] = useState(true);
  const [ispageloader, setispageloader] = useState(true);

  // Fetch chat history on page load
  useEffect(() => {
    const fetchChatHistory = async () => {
      const response = await axios.get("/api/chat-history");
      setMessages(response.data);
    };

    fetchChatHistory();
  }, []);

  useEffect(() => {
          const timer = setTimeout(() => {
            setispageloader(false);
          }, 1000);
          return () => clearTimeout(timer);
      }, []);
  
      // If the loading state is true, show a loading screen means if still loading then show the loading screen
      if(ispageloader) {
          return <Loader />
      }

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setisChatloading(false); // Show loader
    setMessages((prev) => [
      ...prev,
      { userMessage: newMessage, botResponse: null }, // Add a placeholder for the bot response
    ]);

    try {
      const response = await axios.post("/api/generate", {
        mood,
        userMessage: newMessage,
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
      setisChatloading(true); // Hide loader
    }

    setNewMessage(""); // Clear input field
  };

  const setMoodHandler = (value: string) => {
    setMood(value);
  };

  const formatBotResponse = (botResponse: any): string | TrustedHTML => {
    if (!botResponse) return "";
  
    // Convert the response to a clean and HTML-friendly format
    const formattedText = String(botResponse)
      // Replace "**bold**" with <strong>bold</strong>
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Replace newlines (\n) with HTML line breaks (<br>)
      .replace(/\n/g, "<br>")
      // Replace consecutive spaces with non-breaking spaces
      .replace(/ {2,}/g, (match) => "&nbsp;".repeat(match.length));
  
    return formattedText;
  };
  

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <div className="p-4 bg-gray-800">
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
          <h2 className="text-2xl relative">
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
          <div key={index} className="mb-4">
            {/* add profile pic here so that user can feel as a chat with ai friend */}

            <div className="font-bold">You:</div>
            <br />
            <div>{message.userMessage}</div>
            <hr /> <br />
            <div className="font-bold mt-2">Friend AI:</div>
            <br />
            {message.botResponse === null ? (
              <ChatLoader/>
            ) : (
              <div
                  style={{ whiteSpace: "normal", wordWrap: "break-word" }}
                 dangerouslySetInnerHTML={{ __html: formatBotResponse(message.botResponse) }}>
              </div>
            )
          }
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
          className="flex-1 p-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-4 py-2 hover:bg-purple-500 text-white rounded"
        >
          <SendIcon fill="#26A69A" color="#FFCA28" />
        </button>
      </div>
    </div>
  );
}