import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { mood, userMessage } = await req.json();

  const model = google('gemini-2.0-flash-exp');

  const result = await streamText({
    model,
    prompt: `${mood} User says: "${userMessage}"`,
  });

  const text = await result.text;
  return new Response(text, { status: 200 });
}
