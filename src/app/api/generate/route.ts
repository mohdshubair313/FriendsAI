import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDb } from "@/lib/db";
import Chat from "@/app/models/ChatModel";
import { NextResponse } from "next/server";

// Utility function to format responses for better readability
function formatResponse(rawText: string): string {
  // Add double line breaks after periods, question marks, and exclamation points
  let formattedText = rawText.replace(/([.!?])\s+/g, "$1\n\n");

  // Replace numbered lists (e.g., "1.") with properly formatted numbers
  formattedText = formattedText.replace(/(?:^|\n)(\d+)\.\s+/g, "\n$1. ");

  // Replace bullet points (e.g., "•" or "-") with standardized formatting
  formattedText = formattedText.replace(/(?:^|\n)[•-]\s+/g, "\n- ");

  // Return trimmed formatted text
  return formattedText.trim();
}

export async function POST(req: Request) {
  await connectToDb(); // Connect to MongoDB

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY as string);

  try {
    const { mood, userMessage } = await req.json();

    // Prompts for different moods
    const prompts: Record<string, string> = {
      Motivated: "Behave like an Indian motivational speaker. Respond with a warm and motivating tone, mixing Hindi and English but writing in English only. Use numbered steps or bullet points where possible for clarity. Always begin with an inspiring opening line like 'Yaar, tumhaare andar woh fire hai!'.",
      Excited: "Behave like an Indian friend full of excitement. Write in English, mixing Hindi and English in a lively and engaging way. Structure the response using short paragraphs and bullet points to emphasize excitement and clarity.",
      Lover: "Behave like a caring and affectionate partner. Write in English but mix Hindi and English for warmth. Structure the response with short paragraphs and use numbered lists to express admiration or steps for improvement.",
      Friendly: "Behave like an Indian buddy. Respond in English, mixing Hindi and English casually. Begin with a light-hearted tone and use bullet points or numbered lists where necessary for clarity and support.",
      Supportive: "Behave like an Indian friend offering thoughtful advice. Respond in English but mix Hindi and English. Start with a calm and empathetic tone, structuring advice using bullet points or numbered lists for better understanding."
    };

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Generate AI response
    const result = await model.generateContent([
      `${prompts[mood]} User says: "${userMessage}"`
    ]);
    
    const response = result?.response?.text();
    if (!response) {
      throw new Error("No response from AI model.");
    }

    // Format the AI response
    const botResponse = formatResponse(response);

    // Save chat to MongoDB
    await Chat.create({
      mood,
      userMessage,
      botResponse,
    });

    return NextResponse.json({ botResponse });
  } catch (error) {
    console.error("Error generating or saving response:", error);
    return NextResponse.json({ error: "Failed to generate response." }, { status: 500 });
  }
}
