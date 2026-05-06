import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";
import { connectToDb } from "@/lib/db";
import { MediaJob } from "@/models/MediaJob";
import { errMessage } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 200;

/**
 * GET /api/media/list
 *
 * Returns the logged-in user's image generation history (succeeded jobs
 * only — failed/queued jobs are intentionally excluded since they have
 * nothing to display).
 *
 * Powers the Image Studio page (/images). Sorted by finishedAt desc so
 * the newest image is first.
 *
 * Pagination: ?limit=N&before=ISO-date — fetches images whose finishedAt
 * is older than `before`. Used for infinite scroll.
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

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(token.id as string),
      kind: "image",
      status: "succeeded",
      resultUrl: { $exists: true, $ne: null },
    };
    if (beforeIso) {
      const before = new Date(beforeIso);
      if (!isNaN(before.getTime())) {
        query.finishedAt = { $lt: before };
      }
    }

    const jobs = await MediaJob.find(query)
      .sort({ finishedAt: -1 })
      .limit(limit)
      .lean<Array<{
        _id: Types.ObjectId;
        conversationId: Types.ObjectId | null;
        prompt: string;
        modelId: string;
        resultUrl: string;
        createdAt: Date;
        finishedAt?: Date;
      }>>();

    const images = jobs.map((j) => ({
      id: j._id.toString(),
      conversationId: j.conversationId?.toString() ?? null,
      prompt: j.prompt,
      modelId: j.modelId,
      url: j.resultUrl,
      createdAt: j.createdAt,
      finishedAt: j.finishedAt ?? j.createdAt,
    }));

    return NextResponse.json({ images });
  } catch (err) {
    console.error("[media:list] failed:", errMessage(err));
    return NextResponse.json({ error: "Failed to load images" }, { status: 500 });
  }
}
