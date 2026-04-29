import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getEntitlement } from "@/lib/entitlement";
import { hasProviderKey } from "@/services/providers/registry";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entitlement = await getEntitlement(session.user.id);

    if (!entitlement.features.liveAvatar) {
      return NextResponse.json(
        { error: "Live Avatar is a Premium feature. Please upgrade to Pro." },
        { status: 403 }
      );
    }

    if (!hasProviderKey("google")) {
      return NextResponse.json({ error: "Voice service not configured" }, { status: 503 });
    }

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;
    
    return NextResponse.json({
      wsUrl,
      config: {
        model: "gemini-2.0-flash-exp",
        modalities: ["AUDIO"]
      }
    });

  } catch (error) {
    console.error("Voice session error:", error);
    return NextResponse.json({ error: "Failed to initialize voice session" }, { status: 500 });
  }
}
