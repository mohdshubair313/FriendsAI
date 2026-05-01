import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectToDb } from "@/lib/db";
import { User } from "@/models/userModel";
import { getEntitlement } from "@/lib/entitlement";

export const runtime = "nodejs";

/**
 * Aggregated profile endpoint — single fetch the /profile page can use.
 * Returns the user's basic details, locale, preferences, and the
 * fully-resolved entitlement (tier, features, usage remaining today).
 */
export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDb();
    const user = await User.findOne({ email: session.user.email }).lean<any>();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const entitlement = await getEntitlement(user._id.toString());

    // Identify which OAuth provider linked the account (if any).
    const providers: string[] = [];
    if (user.googleId) providers.push("google");
    if (user.githubId) providers.push("github");
    if (user.password) providers.push("email");

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        image: user.image ?? session.user.image ?? null,
        providers,
        createdAt: user.createdAt,
        onboardingCompletedAt: user.onboardingCompletedAt ?? null,
        locale: user.locale ?? null,
        preferences: user.preferences ?? null,
      },
      subscription: {
        tier: entitlement.tier,
        isPremium: entitlement.tier === "pro",
        features: entitlement.features,
        remaining: entitlement.remaining,
      },
    });
  } catch (err) {
    console.error("[profile] Error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
