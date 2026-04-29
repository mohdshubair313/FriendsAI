import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const order = await razorpay.orders.create({
      amount: 99 * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    });
    return NextResponse.json({ orderId: order.id }, { status: 200 });
  } catch (error) {
    console.error("Error creating order", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}
