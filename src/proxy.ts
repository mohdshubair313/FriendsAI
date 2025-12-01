import { NextResponse } from "next/server";

export default function proxy() {
  return NextResponse.next();
}

// Ensure middleware is Node.js runtime compatible
export const config = {
  runtime: "nodejs",
};
