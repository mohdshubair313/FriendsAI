import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest } from "next/server";

export const runtime = "edge"; // Enables Edge runtime for faster responses

export async function POST(req: NextRequest) {
  const { userMessage, mood } = await req.json();

  const model = google("gemini-2.0-flash-exp");

  // Regex to detect prompts for image generation
  const isImagePrompt = /(?:make|generate)(?: an| a)?(?: image| picture| illustration| art)?(?: of)?/i.test(userMessage);

  // Mood-to-tone mapping for customizing response style
  const moodContextMap: Record<string, string> = {
    happy: "Respond in a cheerful and uplifting tone.",
    sad: "Respond in an empathetic and comforting tone.",
    funny: "Respond with humor and light sarcasm.",
    romantic: "Respond in a poetic and dreamy tone.",
    angry: "Respond in a calm and understanding tone.",
    motivational: "Respond with strong encouragement and positive energy.",
    philosophical: "Respond with deep and thoughtful insight.",
  };

  const moodInstruction = moodContextMap[mood?.toLowerCase()] || "";

  if (isImagePrompt) {
    // Clean the prompt to extract the subject
    const cleanedPrompt = userMessage.replace(
      /(?:make|generate)(?: an| a)?(?: image| picture| illustration| art)?(?: of)?/i,
      ""
    ).trim();

    // Stream image generation result with mood context
    const imageResult = await streamText({
      model,
      providerOptions: {
        google: { responseModalities: ["IMAGE"] },
      },
      prompt: `Create a stunning 4K digital art image of: ${cleanedPrompt}. Style: vivid colors, high detail, epic lighting, ultra realistic. Mood: ${mood || "neutral"}.`,
    });

    return imageResult.toDataStreamResponse();
  }

  // Stream text response with mood-influenced prompt
  const textResult = await streamText({
    model,
    prompt: `The user says: "${userMessage}". ${moodInstruction}`,
  });

  return textResult.toDataStreamResponse();
}
