export const runtime = 'edge'; // Avoid Node.js specific code for APIs

import { connectToDb } from "@/lib/db";
import Chat from "@/app/models/ChatModel";

export async function GET() {
  try {
    await connectToDb(); // Connect to MongoDB

    // Fetch chat history
    const chatHistory = await Chat.find().sort({ createdAt: 1 });

    return new Response(JSON.stringify(chatHistory), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetching chat history:", error);

    return new Response(
      JSON.stringify({ error: "Failed to fetch chat history." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
