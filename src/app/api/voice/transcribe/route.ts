import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEntitlement } from "@/lib/entitlement";
import { getProviderApiKey, routeModel } from "@/services/providers/registry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Auth check
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entitlement = await getEntitlement(token.id as string);
    if (!entitlement.features.voiceConversational) {
      return NextResponse.json(
        { error: "Voice features require Premium tier." },
        { status: 403 }
      );
    }

    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 });
    }

    const apiKey = getProviderApiKey("google");
    if (!apiKey) {
      return NextResponse.json({ error: "Voice service not configured" }, { status: 503 });
    }
    
    const config = routeModel("voice_stt");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: config.modelId });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "audio/wav",
          data: audioBase64
        }
      },
      { text: "Please transcribe the spoken language in this audio accurately. Ignore any background noise or non-speech sounds. Output ONLY the transcription text." },
    ]);

    const transcription = result.response.text();

    return NextResponse.json({ transcription });

  } catch (error) {
    console.error("[transcribe] Error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio." },
      { status: 500 }
    );
  }
}
