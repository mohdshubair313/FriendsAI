import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getVoiceSession } from "@/lib/sessions/voiceSession";

export const runtime = "nodejs";

/**
 * GET /api/voice/resume
 *
 * Returns the user's last cached voice-session state (persona,
 * conversation, expression, locale, lastUtteranceAt). Used by the client
 * on reconnect to restore context instantly without round-tripping Mongo.
 *
 * Returns `{ session: null }` when:
 *   - Redis isn't configured (fine, client falls back to defaults)
 *   - No session exists for this user yet
 *   - The TTL elapsed (effectively the same as "no session")
 *
 * Never errors — the client's degraded-mode behaviour is "use Redux
 * defaults", which is identical to a missing session.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await getVoiceSession(token.id as string);
  return NextResponse.json({ session });
}
