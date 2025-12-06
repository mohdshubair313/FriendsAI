// /app/api/check-subscription/route.ts
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { User } from "@/models/userModel";
import { connectToDb } from "@/lib/db";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ isPremium: false });
  }

  await connectToDb();
  const user = await User.findOne({
    email: session.user.email,
  });

  return NextResponse.json({ isPremium: user?.isPremium || false });
}
