import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { getEntitlement } from "@/lib/entitlement";
import { getProviderApiKey, routeModel } from "@/services/providers/registry";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 2000;

const ttsRequestSchema = z.object({
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  voiceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const parsed = ttsRequestSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => i.message).join(", ");
      return NextResponse.json({ error: `Invalid request: ${issues}` }, { status: 400 });
    }

    const { text, voiceId } = parsed.data;

    const config = routeModel("voice_tts", { requiresPremium: true });
    
    console.log(`[TTS] Routing to ${config.provider} model ${config.modelId} for text: "${text.substring(0, 20)}..."`);
    
    return NextResponse.json({ 
      success: true, 
      audioUrl: "https://example.com/mock-audio-stream.mp3",
      provider: config.provider 
    });

  } catch (error) {
    console.error("[TTS] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech." },
      { status: 500 }
    );
  }
}
