// /app/api/check-subscription/route.ts
import { NextResponse } from "next/server";
import { useSession } from "@/context/SessionContext"; 
import { User } from "@/app/models/userModel";
import { connectToDb } from "@/lib/db"; 

export async function GET() {
  const session = useSession(); // Removed unnecessary await
  if (!session?.user?.email) {
    return NextResponse.json({ isPremium: false });
  }

  await connectToDb();
  const user = await User.findOne({
    email: session.user.email,
  });

  return NextResponse.json({ isPremium: user?.isPremium || false });
}
