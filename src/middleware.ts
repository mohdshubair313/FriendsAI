import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

// Ensure middleware is Node.js runtime compatible
export const config = {
  runtime: "nodejs",
};
