import { convertToModelMessages, UIMessage, streamText, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, mood }: { messages: UIMessage[]; mood: string } = await req.json();
    const userMessage = messages[messages.length - 1];

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "No message found" }), { status: 400 });
    }

    const userText =
      userMessage.parts
        ?.filter((part) => part.type === "text")
        .map((part: any) => part.text)
        .join(" ") ?? "";

    // ab regex string pe chalega, array pe nahi
    const isImagePrompt =
      /(generate|make|create|draw|paint)( an| a)? (image|picture|art|illustration|photo)/i.test(
        userText,
      );
    if (isImagePrompt) {
      // It's better to use 'gemini-2.5-flash' or 'gemini-2.5-pro' for text generation
      // that might reference an image, but if you want to use the preview model as you intended:
      const result = streamText({
        model: "google/gemini-3-pro-image",
        system: 'You are a helpful assistant.',
        messages: convertToModelMessages(messages),
      });

      return result.toUIMessageStreamResponse();
    }

    // 🧠 Text response with mood
    const textModel = google("gemini-3-pro-preview"); // Using a stable model name

    const moodContextMap: Record<string, string> = {
      happy: "Respond in a cheerful and uplifting tone.",
      sad: "Respond in an empathetic and comforting tone.",
      funny: "Respond with humor and light sarcasm.",
      romantic: "Respond in a poetic and dreamy tone.",
      angry: "Respond in a calm and understanding tone.",
      motivational: "Respond with strong encouragement and positive energy.",
      philosophical: "Respond with deep and thoughtful insight.",
    };

    const moodInstruction = moodContextMap[mood?.toLowerCase()] || "Respond in a neutral and polite tone.";

    const result = await streamText({
      model: textModel,
      messages: convertToModelMessages(messages),
      system: moodInstruction, // Using system prompt for mood
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("❌ Chat API Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}