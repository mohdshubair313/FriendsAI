import { hash } from "bcryptjs";
import { User } from "@/models/userModel";
import { connectToDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Please provide all required fields" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDb();

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json(
        { message: existingUser.email === email ? "Email already exists" : "Username already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Return success response (don't send password back)
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
  } catch (error) {
    console.error("[Auth/Signup] Error:", error);
    return NextResponse.json(
      { message: "An error occurred during signup. Please try again." },
      { status: 500 }
    );
  }
}
