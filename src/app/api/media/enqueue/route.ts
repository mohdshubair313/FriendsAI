import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { MediaJob } from "@/models/MediaJob";
import { enqueueImageGeneration } from "@/services/queue";
import { getEntitlement } from "@/lib/entitlement";

export const runtime = "nodejs";

const MAX_PROMPT_LENGTH = 500;

const mediaEnqueueSchema = z.object({
  prompt: z.string().min(1).max(MAX_PROMPT_LENGTH),
  type: z.enum(["image", "meme"]).optional(),
  model: z.enum(["flux-pro", "flux-dev", "sdxl-turbo"]).optional(),
});

/**
 * Enqueue Media Generation
 * Securely pushes a prompt to BullMQ for asynchronous processing.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entitlement = await getEntitlement(token.id as string);
    
    if (!entitlement.features.imageGeneration) {
      return NextResponse.json(
        { error: "Image generation is a Premium feature." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = mediaEnqueueSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`);
      return NextResponse.json({ error: `Invalid prompt: ${issues.join(", ")}` }, { status: 400 });
    }

    const { prompt, type, model } = parsed.data;
    const sanitizedPrompt = prompt.slice(0, MAX_PROMPT_LENGTH);
    
    const job = await MediaJob.create({
      userId: token.id,
      conversationId: null,
      kind: type || "image",
      prompt: sanitizedPrompt,
      modelId: model || "flux-pro",
      status: "queued"
    });

    await enqueueImageGeneration(job._id.toString(), sanitizedPrompt, model || "flux-pro");

    return NextResponse.json({ 
      success: true, 
      jobId: job._id, 
      status: "queued" 
    });

  } catch (error) {
    console.error("[Media Enqueue] Error:", error);
    return NextResponse.json({ error: "Failed to enqueue media job" }, { status: 500 });
  }
}
