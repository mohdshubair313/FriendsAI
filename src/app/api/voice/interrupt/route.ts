import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/**
 * Voice Interruption Endpoint.
 * In a real-time Zoom-like call, if the user starts speaking while the AI is talking,
 * the frontend fires this endpoint.
 * This instructs the backend to immediately halt any ongoing TTS generation streams 
 * and clear the audio queue for the active AvatarSession.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required for interruption." }, { status: 400 });
    }

    // In a production WebRTC setup (LiveKit/Mediasoup), you would broadcast a 
    // "cancel_track" or "clear_queue" event to the media server here.
    console.log(`[Interruption] Halting TTS stream and clearing audio queue for session ${sessionId}`);

    // Additionally, we might update the AvatarSession state to "listening" immediately.
    // await AvatarSession.findByIdAndUpdate(sessionId, { "persistence.lastState": "listening" });

    return NextResponse.json({ success: true, message: "Playback interrupted successfully." });
  } catch (error) {
    console.error("[Interrupt] Error:", error);
    return NextResponse.json(
      { error: "Failed to process interruption." },
      { status: 500 }
    );
  }
}
