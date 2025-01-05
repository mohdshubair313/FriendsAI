import { connectToDb } from "@/lib/db";
import Chat from "@/app/models/ChatModel";

export async function GET() {
  await connectToDb(); // Connect to MongoDB

  try {
    // Fetch chat history from MongoDB
    const chatHistory = await Chat.find().sort({ createdAt: 1 }); // Sort by oldest first

    // Return JSON response with status 200
    return new Response(JSON.stringify(chatHistory), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);

    // Return JSON error response with status 500
    return new Response(
      JSON.stringify({ error: "Failed to fetch chat history." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
