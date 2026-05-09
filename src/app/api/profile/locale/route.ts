import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { connectToDb } from "@/lib/db";
import { User } from "@/models/userModel";
import { isValidPair } from "@/lib/locale/catalog";

export const runtime = "nodejs";

const patchSchema = z.object({
  country: z.string().length(2, "Country must be ISO-3166-1 alpha-2"),
  primaryLanguage: z.string().min(2, "Language code required"),
});

/**
 * PATCH /api/profile/locale
 * Updates the user's country + primary language. Validated against the
 * catalog so a stale UI can't write a bogus pair.
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

  if (!isValidPair(parsed.data.country, parsed.data.primaryLanguage)) {
    return NextResponse.json(
      { error: "Unsupported country/language combination" },
      { status: 400 }
    );
  }

  try {
    await connectToDb();
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          "locale.country": parsed.data.country,
          "locale.primaryLanguage": parsed.data.primaryLanguage,
        },
      }
    );
    return NextResponse.json({ ok: true, ...parsed.data });
  } catch (err) {
    console.error("[profile/locale] update failed:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
