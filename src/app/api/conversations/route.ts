import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";
import { connectToDb } from "@/lib/db";
import { Conversation, Message } from "@/models/Conversation";
import { errMessage } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /api/conversations
 *
 * Returns the logged-in user's conversations, newest first, with a snippet
 * of the last message attached. Powers the sidebar's "Recent Activity"
 * list and the future history page.
 *
 * The aggregation joins each Conversation with its most-recent Message
 * (sorted by createdAt desc, limited to 1) so the UI can show a preview
 * without an N+1 round-trip per row.
 *
 * Pagination: ?limit=N&before=ISO-date — fetches conversations whose
 * updatedAt < `before`. Used for infinite scroll.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT);
  const beforeIso = url.searchParams.get("before");

  try {
    await connectToDb();

    const match: Record<string, unknown> = {
      userId: new Types.ObjectId(token.id as string),
      archivedAt: { $in: [null, undefined] },
    };
    if (beforeIso) {
      const before = new Date(beforeIso);
      if (!isNaN(before.getTime())) {
        match.updatedAt = { $lt: before };
      }
    }

    const rows = await Conversation.aggregate([
      { $match: match },
      { $sort: { updatedAt: -1 } },
      { $limit: limit },
      {
        // Pull the most recent message for each conversation in one go
        // instead of N+1 follow-up queries from the route.
        $lookup: {
          from: Message.collection.name,
          let: { convId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$conversationId", "$$convId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { content: 1, role: 1, createdAt: 1 } },
          ],
          as: "lastMessage",
        },
      },
      {
        $addFields: { lastMessage: { $arrayElemAt: ["$lastMessage", 0] } },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          pinned: 1,
          createdAt: 1,
          updatedAt: 1,
          lastMessage: 1,
        },
      },
    ]);

    const conversations = rows.map((c) => ({
      id: c._id.toString(),
      title: (c.title as string) || "New conversation",
      pinned: !!c.pinned,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      preview: typeof c.lastMessage?.content === "string"
        ? c.lastMessage.content.slice(0, 120)
        : null,
      lastMessageRole: c.lastMessage?.role ?? null,
    }));

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[conversations] list failed:", errMessage(err));
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
  }
}
