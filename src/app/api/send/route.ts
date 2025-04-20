import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, message } = body;

  try {
    // 1. Send to YOU
    await resend.emails.send({
      from: 'Shubair <onboarding@resend.dev>',
      to: ['shubair313@gmail.com'], // your email
      subject: `📬 New Feedback from ${name}`,
      html: `
        <h3>You've received a new feedback!</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    });

    // 2. Auto reply to USER
    await resend.emails.send({
      from: 'Shubair <onboarding@resend.dev>',
      to: [email],
      subject: `Thanks for your Feedback, ${name}!`,
      html: `
        <h3>Hey ${name},</h3>
        <p>Thanks a lot for your feedback! 💜</p>
        <p>We truly value your time and input.</p>
        <br/>
        <p>- Team Shubair</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return new Response("Something went wrong", { status: 500 });
  }
}
