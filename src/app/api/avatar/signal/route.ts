import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { WebRTCSignalingService } from "@/services/avatar/webrtcService";

export const runtime = "nodejs";

/**
 * WebRTC Signaling Route
 * Handles SDP (Offer/Answer) and ICE Candidate exchanges for Live Avatar sessions.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, sdp, candidate, sessionId } = await req.json();

    const signaling = new WebRTCSignalingService();

    if (type === "offer") {
      const answer = await signaling.handleOffer(sessionId, sdp);
      return NextResponse.json({ type: "answer", sdp: answer });
    }

    if (type === "candidate") {
      await signaling.handleCandidate(sessionId, candidate);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid signal type" }, { status: 400 });

  } catch (error) {
    console.error("[Avatar Signal] Error:", error);
    return NextResponse.json({ error: "Signaling failed" }, { status: 500 });
  }
}
