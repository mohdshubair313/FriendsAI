import mongoose from "mongoose";

/**
 * MongoDB connection manager.
 *
 * Uses a global cache on the Node.js process to prevent
 * creating multiple connections during dev hot-reloads.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend global to cache the connection across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongooseCache ?? { conn: null, promise: null };
global.__mongooseCache = cached;

export async function connectToDb(): Promise<typeof mongoose> {
  // Return existing connection
  if (cached.conn) {
    return cached.conn;
  }

  // Return in-flight connection promise
  if (cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined in environment variables. " +
      "Add it to .env (see .env.example)."
    );
  }

  mongoose.set("strictQuery", true);

  cached.promise = mongoose
    .connect(MONGODB_URI, {
      bufferCommands: false,
    })
    .then((m) => {
      console.log("[DB] Connected to MongoDB");
      return m;
    });

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("[DB] Connection failed:", error);
    throw error;
  }

  return cached.conn;
}
