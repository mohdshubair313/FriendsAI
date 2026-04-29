import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { User } from "@/models/userModel";

export const runtime = "nodejs";

/**
 * User Onboarding State Management.
 * Completes the onboarding flow so the tutorial/walkthrough is not shown again.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findByIdAndUpdate(
      token.id,
      { onboardingCompletedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, onboardingCompletedAt: user.onboardingCompletedAt });
  } catch (error) {
    console.error("[Onboarding] Error updating state:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
