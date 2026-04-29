import crypto from "crypto";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { User } from "@/models/userModel";
import { connectToDb } from "@/lib/db";
import { verifyPaymentSchema } from "@/lib/schemas";
import { upgradeToPro } from "@/lib/entitlement";

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  // Verify Razorpay signature
  const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(sign)
    .digest("hex");

  if (expectedSign !== razorpay_signature) {
    return NextResponse.json({ error: "Payment signature mismatch" }, { status: 400 });
  }

  try {
    await connectToDb();

    // Find the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upgrade via entitlement system (creates/updates Subscription)
    await upgradeToPro(user._id.toString());

    // Dual-write: also set isPremium for backward compat during migration
    await User.findOneAndUpdate(
      { email: session.user.email },
      { isPremium: true },
      { new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
