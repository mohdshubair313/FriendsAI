import { NextResponse } from "next/server";

export function middleware() {
  // Add your middleware logic here
  console.log("Middleware executed");
  return NextResponse.next();
}

// Ensure middleware is Node.js runtime compatible
export const config = {
  runtime: "nodejs",
};
