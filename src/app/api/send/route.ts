import { Resend } from "resend";
import { NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = await req.json();
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, message } = parsed.data;
  const safeName = esc(name);
  const safeEmail = esc(email);
  const safeMessage = esc(message).replace(/\n/g, "<br>");

  try {
    await resend.emails.send({
      from: "Friends AI <onboarding@resend.dev>",
      to: ["shubair313@gmail.com"],
      subject: `New Feedback from ${safeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#f59e0b">New Feedback Received</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #f59e0b;padding-left:12px;color:#555">${safeMessage}</blockquote>
        </div>
      `,
    });

    await resend.emails.send({
      from: "Friends AI <onboarding@resend.dev>",
      to: [email],
      subject: `Thanks for your feedback, ${safeName}!`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#f59e0b">Thanks, ${safeName}!</h2>
          <p>We received your feedback and truly appreciate you taking the time.</p>
          <p>We'll review it and get back to you if needed.</p>
          <br/>
          <p style="color:#888">— The Friends AI Team</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
