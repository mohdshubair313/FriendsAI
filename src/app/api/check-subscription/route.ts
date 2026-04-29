import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { User } from "@/models/userModel";
import { connectToDb } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlement";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ isPremium: false, tier: "free", features: {} });
  }

  try {
    await connectToDb();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ isPremium: false, tier: "free", features: {} });
    }

    const entitlement = await getEntitlement(user._id.toString());

    return NextResponse.json({
      // Backward compat
      isPremium: entitlement.tier === "pro",
      // New entitlement fields
      tier: entitlement.tier,
      features: entitlement.features,
      remaining: entitlement.remaining,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json({ isPremium: false, tier: "free", features: {} });
  }
}
