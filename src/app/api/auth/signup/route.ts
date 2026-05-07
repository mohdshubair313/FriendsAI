import { hash } from "bcryptjs";
import { User } from "@/models/userModel";
import { connectToDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const reqId = Math.random().toString(36).substring(2, 8);
  const timestamp = new Date().toISOString();
  console.log(`[Signup][${reqId}][${timestamp}] ========== SIGNUP REQUEST START ==========`);
  console.log(`[Signup][${reqId}] Method: ${req.method}, URL: ${req.url}`);
  console.log(`[Signup][${reqId}] Headers:`, {
    "content-type": req.headers.get("content-type"),
    "user-agent": req.headers.get("user-agent")?.substring(0, 80),
    origin: req.headers.get("origin"),
    host: req.headers.get("host"),
  });

  try {
    // Step 1: Parse request body
    console.log(`[Signup][${reqId}] Step 1: Parsing request body...`);
    let body: Record<string, unknown>;
    try {
      body = await req.json();
      console.log(`[Signup][${reqId}] Body parsed OK. Keys: ${Object.keys(body).join(", ")}`);
    } catch (parseError) {
      console.error(`[Signup][${reqId}] ❌ Failed to parse request body:`, parseError);
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { username, email, password } = body as { username: string; email: string; password: string };
    console.log(`[Signup][${reqId}] username="${username}", email="${email}", password_length=${password?.length ?? 0}`);

    // Validation
    if (!username || !email || !password) {
      console.log(`[Signup][${reqId}] ❌ Validation failed: missing fields`);
      return NextResponse.json(
        { message: "Please provide all required fields" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`[Signup][${reqId}] ❌ Email validation failed`);
      return NextResponse.json(
        { message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      console.log(`[Signup][${reqId}] ❌ Password too short`);
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Step 2: Connect to database
    console.log(`[Signup][${reqId}] Step 2: Connecting to database...`);
    const dbStart = Date.now();
    try {
      await connectToDb();
      console.log(`[Signup][${reqId}] ✅ DB connected in ${Date.now() - dbStart}ms`);
    } catch (dbError) {
      console.error(`[Signup][${reqId}] ❌ DB connection failed after ${Date.now() - dbStart}ms:`, dbError);
      return NextResponse.json(
        { message: "Database connection failed. Please try again later.", debug: process.env.NODE_ENV === "development" ? String(dbError) : undefined },
        { status: 503 }
      );
    }

    // Step 3: Check if user already exists
    console.log(`[Signup][${reqId}] Step 3: Checking for existing user...`);
    const findStart = Date.now();
    let existingUser;
    try {
      existingUser = await User.findOne({ $or: [{ email }, { username }] });
      console.log(`[Signup][${reqId}] findOne completed in ${Date.now() - findStart}ms, found=${!!existingUser}`);
    } catch (findError) {
      console.error(`[Signup][${reqId}] ❌ User lookup failed after ${Date.now() - findStart}ms:`, findError);
      return NextResponse.json(
        { message: "Database query failed. Please try again." },
        { status: 500 }
      );
    }

    if (existingUser) {
      const reason = existingUser.email === email ? "Email already exists" : "Username already taken";
      console.log(`[Signup][${reqId}] ❌ Duplicate user: ${reason}`);
      return NextResponse.json(
        { message: reason },
        { status: 409 }
      );
    }

    // Step 4: Hash password
    console.log(`[Signup][${reqId}] Step 4: Hashing password...`);
    const hashStart = Date.now();
    let hashedPassword: string;
    try {
      hashedPassword = await hash(password, 10);
      console.log(`[Signup][${reqId}] ✅ Password hashed in ${Date.now() - hashStart}ms`);
    } catch (hashError) {
      console.error(`[Signup][${reqId}] ❌ Password hashing failed:`, hashError);
      return NextResponse.json(
        { message: "Internal error during account creation." },
        { status: 500 }
      );
    }

    // Step 5: Create new user
    console.log(`[Signup][${reqId}] Step 5: Creating user in database...`);
    const createStart = Date.now();
    let newUser;
    try {
      newUser = await User.create({
        username,
        email,
        password: hashedPassword,
      });
      console.log(`[Signup][${reqId}] ✅ User created in ${Date.now() - createStart}ms, id=${newUser._id}`);
    } catch (createError: unknown) {
      console.error(`[Signup][${reqId}] ❌ User creation failed after ${Date.now() - createStart}ms`);
      console.error(`[Signup][${reqId}] Error name:`, createError instanceof Error ? createError.name : "unknown");
      console.error(`[Signup][${reqId}] Error message:`, createError instanceof Error ? createError.message : String(createError));

      // Check for MongoDB duplicate key error
      if (createError instanceof Error && "code" in createError && (createError as Record<string, unknown>).code === 11000) {
        console.error(`[Signup][${reqId}] Duplicate key error (race condition):`, (createError as Record<string, unknown>).keyPattern);
        return NextResponse.json(
          { message: "Email or username already taken" },
          { status: 409 }
        );
      }

      // Check for Mongoose validation error
      if (createError instanceof Error && createError.name === "ValidationError") {
        console.error(`[Signup][${reqId}] Mongoose validation error:`, createError.message);
        return NextResponse.json(
          { message: `Validation failed: ${createError.message}` },
          { status: 400 }
        );
      }

      console.error(`[Signup][${reqId}] Full error:`, createError);
      return NextResponse.json(
        { message: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    // Return success response (don't send password back)
    console.log(`[Signup][${reqId}] ✅ SIGNUP SUCCESS for ${email}`);
    console.log(`[Signup][${reqId}] ========== SIGNUP REQUEST END ==========`);
    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(`[Signup][${reqId}] ❌ UNHANDLED ERROR in signup route`);
    console.error(`[Signup][${reqId}] Error name:`, error instanceof Error ? error.name : "unknown");
    console.error(`[Signup][${reqId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[Signup][${reqId}] Error stack:`, error instanceof Error ? error.stack : "no stack");
    console.error(`[Signup][${reqId}] Full error:`, error);
    console.log(`[Signup][${reqId}] ========== SIGNUP REQUEST END (ERROR) ==========`);
    return NextResponse.json(
      { message: "An error occurred during signup. Please try again." },
      { status: 500 }
    );
  }
}

