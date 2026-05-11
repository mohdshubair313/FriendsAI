import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { connectToDb } from "@/lib/db";
import { User } from "@/models/userModel";

export const runtime = "nodejs";

const patchSchema = z.object({
  ttsVoiceId: z.enum(["warm_female", "confident_male", "bright_playful", "calm_senior"]),
});

/**
 * PATCH /api/profile/voice
 *
 * Persists the user's preferred voice style (warm_female / confident_male / …).
 * The voice-service resolves this to a Sarvam speaker ID at TTS time via
 * src/lib/voices/catalog.ts.
 */
export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    await connectToDb();
    await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { "preferences.ttsVoiceId": parsed.data.ttsVoiceId } }
    );
    return NextResponse.json({ ok: true, ttsVoiceId: parsed.data.ttsVoiceId });
  } catch (err) {
    console.error("[profile/voice] update failed:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
