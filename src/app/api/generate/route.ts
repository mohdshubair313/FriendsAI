import { streamText, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, mood }: { messages: { content: string }[]; mood: string } = await req.json();
    const userMessage = messages[messages.length - 1]?.content;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "No message found" }), { status: 400 });
    }

    // 🖼️ Check if the prompt is for image
    const isImagePrompt = /(generate|make|create|draw|paint)( an| a)? (image|picture|art|illustration|photo)/i.test(userMessage);

    if (isImagePrompt) {
      const model = google("gemini-2.0-flash-exp");
      const result = await generateText({
        model,
        prompt: userMessage,
        providerOptions: {
          google: { responseModalities: ["TEXT", "IMAGE"] },
        },
      });

      // const parts = result.content?.parts || [];
      const parts = result.text
      console.log(parts)

      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    // 🧠 Text response with mood
    const textModel = google("gemini-2.0-flash-exp");

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

    const textResult = await streamText({
      model: textModel,
      prompt: `The user says: "${userMessage}". ${moodInstruction}`,
    });

    return textResult.toDataStreamResponse();
  } catch (error) {
    console.error("❌ Chat API Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
