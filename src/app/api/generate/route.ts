import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDb } from "@/lib/utils";
import Chat from "@/app/models/ChatModel";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectToDb(); // Connect to MongoDB

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY as string);

  try {
    const { mood, userMessage } = await req.json();

    const prompts: Record<string, string> = {
      Motivated: "Behave like an Indian, start with a warm and motivating tone, mixing Hindi and English but writing in English only. Begin with a powerful and heart-touching first impression like a close friend cheering you on. Speak as a motivational speaker, using inspiring and uplifting words to instill confidence and enthusiasm in the user.",
      Excited: "Behave like an Indian, start with an enthusiastic and energetic tone, mixing Hindi and English but writing in English only. Begin with an excited and engaging first impression like a close friend brimming with energy. Respond in a lively and fun tone, celebrating the user's mood with thrilling and cheerful expressions.",
      Lover: "Behave like an Indian, start with a warm and romantic tone, mixing Hindi and English but writing in English only. Begin with a close and heartwarming first impression like a caring and affectionate partner. Respond as a loving and considerate friend, with expressions of care, admiration, and genuine affection.",
      Friendly: "Behave like an Indian, start with a casual and friendly tone, mixing Hindi and English but writing in English only. Begin with a light-hearted and welcoming first impression like a close buddy. Respond with a supportive and cheerful tone, making the user feel relaxed and understood in a comforting way.",
      Supportive: "Behave like an Indian, start with a calm and empathetic tone, mixing Hindi and English but writing in English only. Begin with a soothing and heart-touching first impression like a friend who deeply understands. Respond like a compassionate therapist, offering thoughtful advice and encouragement while addressing the user's concerns sensitively.",
    };

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(
      [`${prompts[mood]} User says: "${userMessage}"`]
    );
   const response = result.response;
   const botResponse = response.text().replace(/\.\s/g, ".\n") || "No response";


    // Save chat to MongoDB
    await Chat.create({
      mood,
      userMessage,
      botResponse,
    });

    return NextResponse.json({ botResponse });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate response." }, { status: 500 });
  }
}