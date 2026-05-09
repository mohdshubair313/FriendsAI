import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { connectToDb } from "@/lib/db";
import { User } from "@/models/userModel";

export const runtime = "nodejs";

const patchSchema = z.object({
  buddyPersona: z.enum([
    "friendly",
    "humorous",
    "philosophical",
    "romantic",
    "motivational",
    "doctor",
    "comedian",
    "senior_dev",
  ]),
});

/**
 * PATCH /api/profile/persona
 * Updates only the buddyPersona field on the user's preferences.
 * Tiny endpoint by design — full preferences updates go through the
 * onboarding/profile flow with stricter validation.
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
      { $set: { "preferences.buddyPersona": parsed.data.buddyPersona } }
    );
    return NextResponse.json({ ok: true, buddyPersona: parsed.data.buddyPersona });
  } catch (err) {
    console.error("[profile/persona] update failed:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
