import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protected route prefixes — unauthenticated users
 * are redirected to /signin with a callbackUrl.
 */
const PROTECTED_PREFIXES = ["/chat", "/premium", "/live_talk", "/settings"];

/**
 * API routes that require authentication.
 */
const PROTECTED_API_PREFIXES = [
  "/api/orchestrate",
  "/api/voice",
  "/api/media",
  "/api/create-order",
  "/api/verify-payment",
  "/api/check-subscription",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );

  if (isProtectedPage || isProtectedApi) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

    if (!token) {
      if (isProtectedApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = "/signin";
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/premium/:path*",
    "/live_talk/:path*",
    "/settings/:path*",
    "/api/orchestrate/:path*",
    "/api/voice/:path*",
    "/api/media/:path*",
    "/api/create-order/:path*",
    "/api/verify-payment/:path*",
    "/api/check-subscription/:path*",
  ],
};
