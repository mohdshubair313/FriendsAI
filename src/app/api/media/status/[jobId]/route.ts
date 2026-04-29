import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MediaJob } from "@/models/MediaJob";

export const runtime = "nodejs";

/**
 * Status polling fallback for async media jobs.
 * Used if the WebSocket or SSE connection drops.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const job = await MediaJob.findById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Ensure the user owns the job
    if (job.userId.toString() !== token.id) {
      return NextResponse.json({ error: "Unauthorized access to job" }, { status: 403 });
    }

    return NextResponse.json({
      jobId: job._id,
      status: job.status,
      resultUrl: job.resultUrl,
      error: job.error,
      finishedAt: job.finishedAt
    });

  } catch (error) {
    console.error("[Media Status] Error fetching job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
