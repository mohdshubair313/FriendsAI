import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";
import { connectToDb } from "@/lib/db";
import { Conversation, Message } from "@/models/Conversation";
import { errMessage } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

interface MessagePart {
  type: string;
  text?: string;
  url?: string;
  mediaJobId?: Types.ObjectId | string;
}

/**
 * GET /api/conversations/[id]/messages
 *
 * Returns the messages for a single conversation in chronological order.
 * Used by the chat page to rehydrate the conversation when the user
 * navigates back via the sidebar or refreshes mid-conversation.
 *
 * Auth: only the conversation's owner can read its messages.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT);

  try {
    await connectToDb();

    const conv = await Conversation.findById(id).lean<{
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      title?: string;
    }>();
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (conv.userId.toString() !== token.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await Message.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean<Array<{
        _id: Types.ObjectId;
        role: "user" | "assistant" | "tool" | "system";
        content: string;
        parts: MessagePart[];
        createdAt: Date;
      }>>();

    const out = messages.map((m) => {
      // Pull the first image part (if any) so the client can render images
      // inline without parsing the parts blob.
      const imagePart = Array.isArray(m.parts)
        ? m.parts.find((p) => p?.type === "image" && typeof p.url === "string")
        : undefined;
      return {
        id: m._id.toString(),
        role: m.role,
        content: m.content,
        imageUrl: imagePart?.url ?? null,
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({
      conversation: {
        id: conv._id.toString(),
        title: conv.title ?? "Conversation",
      },
      messages: out,
    });
  } catch (err) {
    console.error("[conversations:messages] failed:", errMessage(err));
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}
