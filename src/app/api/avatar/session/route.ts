import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { AvatarSession } from "@/models/AvatarSession";
import { WebRTCSignalingService } from "@/services/avatar/webrtcService";

export const runtime = "nodejs";

/**
 * Avatar Session Lifecycle Route
 * Manages start, pause, stop and billing for live sessions.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, sessionId, conversationId } = await req.json();

    const signaling = new WebRTCSignalingService();

    if (action === "start") {
      const params = await signaling.createRoom(token.id as string, conversationId);
      return NextResponse.json(params);
    }

    if (action === "stop") {
      await signaling.endSession(sessionId);
      return NextResponse.json({ success: true });
    }

    // Additional actions: pause, resume, etc. can be implemented here.

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("[Avatar Session] Error:", error);
    return NextResponse.json({ error: "Session operation failed" }, { status: 500 });
  }
}
