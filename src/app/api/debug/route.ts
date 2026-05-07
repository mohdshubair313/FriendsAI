import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectToDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ts = new Date().toISOString();
  console.log(`[Debug][${ts}] Health-check endpoint hit`);

  const result: Record<string, unknown> = {
    timestamp: ts,
    status: "checking",
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV ?? "not-set",
    vercel_region: process.env.VERCEL_REGION ?? "not-set",
  };

  // 1. Check critical env vars (existence only — never expose values)
  result.env = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    MONGODB_URI_length: process.env.MONGODB_URI?.length ?? 0,
    MONGODB_URI_prefix: process.env.MONGODB_URI?.substring(0, 14) ?? "MISSING",
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "NOT SET",
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GITHUB_ID: !!process.env.GITHUB_ID,
  };

  // 2. Check mongoose state before connect
  result.mongoose_pre = {
    readyState: mongoose.connection.readyState,
    readyStateLabel: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] ?? "unknown",
    host: mongoose.connection.host || "none",
    name: mongoose.connection.name || "none",
  };

  // 3. Attempt DB connection
  try {
    const dbStart = Date.now();
    await connectToDb();
    const dbElapsed = Date.now() - dbStart;

    result.db = {
      connected: true,
      elapsed_ms: dbElapsed,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      dbName: mongoose.connection.name,
    };

    // Try listing collections as a deeper check
    try {
      const collections = await mongoose.connection.db!.listCollections().toArray();
      result.db_collections = collections.map((c) => c.name);
    } catch (colErr) {
      result.db_collections_error = colErr instanceof Error ? colErr.message : String(colErr);
    }
  } catch (dbError) {
    result.db = {
      connected: false,
      error_name: dbError instanceof Error ? dbError.name : "unknown",
      error_message: dbError instanceof Error ? dbError.message : String(dbError),
    };
  }

  // 4. Check auth token
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    result.auth = {
      tokenExists: !!token,
      userId: token?.id ?? null,
      hasEmail: !!token?.email,
    };
  } catch (authErr) {
    result.auth = {
      error: authErr instanceof Error ? authErr.message : String(authErr),
    };
  }

  result.status = result.db && (result.db as Record<string, unknown>).connected ? "healthy" : "unhealthy";

  console.log(`[Debug][${ts}] Health-check result:`, JSON.stringify(result, null, 2));

  return NextResponse.json(result, {
    status: result.status === "healthy" ? 200 : 503,
  });
}