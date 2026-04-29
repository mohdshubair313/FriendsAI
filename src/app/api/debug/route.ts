import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  
  return NextResponse.json({
    message: "Debug endpoint working",
    tokenExists: !!token,
    userId: token?.id,
    hasEmail: !!token?.email,
    tokenData: token
  });
}