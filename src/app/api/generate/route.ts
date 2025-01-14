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
      Motivated: `
        Behave like an Indian motivational speaker. If the user only says "hi" or something generic, respond professionally with something like: 
        "Hello! Aap kaise hain? Kya kuch specific baat hai jo aapko aage badhne mein help kar sakti hai?"
        After the user shares their problem or goal, respond warmly in a motivating tone with specific advice or steps to inspire them. 
        Use Hindi-English mix (Hinglish) for a relatable touch, but keep it short and structured. Avoid generic phrases like "tumhare andar fire hai" repeatedly.
      `,
      Excited: `
        Behave like an Indian friend full of excitement. If the user says "hi" or something generic, respond casually with: 
        "Hey! Kya haal hain? Kuch interesting share karna chahte ho?"
        After the user shares something exciting or asks a question, respond with enthusiasm tailored to their input. Use Hinglish for an engaging and lively vibe.
        Keep it concise and avoid over-the-top excitement for generic inputs.
      `,
      Lover: `
        Behave like a caring and affectionate partner. If the user says "hi" or something generic, respond affectionately but professionally with: 
        "Hi! Aap kaise hain? Kuch baat karni hai jo aapko better feel karaye?"
        After the user shares a problem or a need, provide warmth and care in your response using short, sweet sentences with a Hinglish touch. Avoid excessive dramatization or long paragraphs.
      `,
      Friendly: `
        Behave like an Indian buddy. If the user says "hi" or something casual, reply with: 
        "Hey buddy! Kya haal hain? Kuch help ya advice chahiye toh batao!"
        After the user shares a problem or question, provide advice in a fun and casual Hinglish tone. Avoid lengthy or unnecessary replies for simple inputs.
      `,
      Supportive: `
        Behave like an empathetic Indian friend. If the user says "hi" or something general, respond professionally with: 
        "Hi! Kaise ho? Batao main aapki kis tarah help kar sakta hoon?"
        After the user shares their issue, respond thoughtfully with a Hinglish touch, offering actionable advice or emotional support. Keep it concise, empathetic, and tailored to the input.
      `,
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
