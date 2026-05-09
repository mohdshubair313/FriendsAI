/**
 * Demo Pro user seeder.
 *
 * Creates (or upserts) a user with an active Pro subscription so you can
 * test gated features end-to-end without going through Razorpay checkout.
 *
 * Usage (env loaded via `tsx --env-file=.env`):
 *   npm run seed:demo
 *   npm run seed:demo -- --email=me@example.com --password=Test1234!
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/userModel";
import { upgradeToPro } from "../src/lib/entitlement";

// ─── CLI args ────────────────────────────────────────────────────────────────
function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found?.slice(prefix.length);
}

const DEMO_EMAIL = parseArg("email") ?? "pro-demo@friendsai.app";
const DEMO_PASSWORD = parseArg("password") ?? "FriendsAIDemo2024!";
const DEMO_USERNAME = parseArg("username") ?? "ProDemoUser";

// ─── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set. Make sure your .env file has it.");
    process.exit(1);
  }

  console.log("→ Connecting to MongoDB…");
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  console.log("✅ Connected.");

  // 1. Upsert user
  let user = await User.findOne({ email: DEMO_EMAIL.toLowerCase() });

  if (!user) {
    const hashed = await bcrypt.hash(DEMO_PASSWORD, 12);
    user = await User.create({
      username: DEMO_USERNAME,
      email: DEMO_EMAIL,
      password: hashed,
      onboardingCompletedAt: new Date(),
    });
    console.log(`✅ Created new user: ${DEMO_EMAIL}`);
  } else {
    console.log(`ℹ User already exists: ${DEMO_EMAIL} — keeping current password.`);
  }

  // 2. Grant Pro via the canonical helper (sets features + quotas + period)
  const ent = await upgradeToPro(user._id.toString());

  console.log("");
  console.log("─────────────────────────────────────────────");
  console.log("  🎉  PRO DEMO USER READY");
  console.log("─────────────────────────────────────────────");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Tier:     ${ent.tier}`);
  console.log(`  Features:`);
  console.log(`    • imageGeneration:     ${ent.features.imageGeneration}`);
  console.log(`    • voiceConversational: ${ent.features.voiceConversational}`);
  console.log(`    • advancedAgents:      ${ent.features.advancedAgents}`);
  console.log(`    • liveAvatar:          ${ent.features.liveAvatar}`);
  console.log(`  Remaining today:`);
  console.log(`    • images:        ${ent.remaining.imagesToday}`);
  console.log(`    • voice seconds: ${ent.remaining.voiceSecondsToday}`);
  console.log("─────────────────────────────────────────────");
  console.log("");

  await mongoose.connection.close();
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
