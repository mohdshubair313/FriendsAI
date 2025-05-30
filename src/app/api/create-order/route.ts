import { NextResponse } from "next/server"
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST() {
    try {
        const order = await razorpay.orders.create({
            amount: 100 * 100,  // this is the amount in paise
            currency: "INR",
            receipt: "receipt_ " + Math.random().toString(36).substring(7),
        })
        return NextResponse.json({orderId: order.id}, {status: 200});
    } catch (error) {
        console.log("Error creating order" , error);
        return NextResponse.json(
            {error: "Error creating order "},
            {status: 500}
        )
    };
};