import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/userModel";
import { Subscription } from "../src/models/Subscription";
import * as dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/spherial-ai";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB...");

  const demoEmail = "pro-demo@spherial.ai";
  const demoPassword = "SpherialDemo2024!";

  // 1. Check if user exists
  let user = await User.findOne({ email: demoEmail });

  if (!user) {
    const hashedPassword = await bcrypt.hash(demoPassword, 12);
    user = await User.create({
      username: "ProDemoUser",
      email: demoEmail,
      password: hashedPassword,
      onboardingCompletedAt: new Date()
    });
    console.log("Created demo user:", demoEmail);
  } else {
    console.log("Demo user already exists.");
  }

  // 2. Grant Pro Subscription
  await Subscription.findOneAndUpdate(
    { userId: user._id },
    {
      tier: "pro",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      features: {
        liveAvatar: true,
        imageGeneration: true,
        voiceConversational: true,
        priorityAccess: true
      },
      quotas: {
        imagesPerDay: 100,
        voiceMinutesPerMonth: 1000
      }
    },
    { upsate: true, new: true, upsert: true }
  );

  console.log("Granting Pro Subscription: SUCCESS");
  console.log("-----------------------------------------");
  console.log(`Email: ${demoEmail}`);
  console.log(`Password: ${demoPassword}`);
  console.log("-----------------------------------------");

  await mongoose.connection.close();
}

seed().catch(console.error);
