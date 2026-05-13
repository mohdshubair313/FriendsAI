import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { touchVoiceSession } from "@/lib/sessions/voiceSession";

export const runtime = "nodejs";

/**
 * POST /api/voice/heartbeat
 *
 * Cheap liveness ping. The client calls this every 15s while a voice
 * session is active to:
 *
 *   1. Tell us "user is still here" → extend Redis TTL on their session.
 *   2. Get a synchronous proof the server + network are reachable. If the
 *      fetch fails (offline, ISP outage, captive portal), the client's
 *      useNetworkState flips to "reconnecting" and ReconnectOverlay shows.
 *
 * Body: empty (auth lives in NextAuth cookies).
 * Response: { ok: true, ts: number } — used as a "now" reference if the
 * client wants to detect clock drift.
 *
 * No-op when Redis isn't configured — heartbeat still returns 200 so the
 * network monitor doesn't false-positive.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await touchVoiceSession(token.id as string);
  return NextResponse.json({ ok: true, ts: Date.now() });
}
