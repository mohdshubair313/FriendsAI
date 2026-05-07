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
  const timestamp = new Date().toISOString();

  // Return existing connection
  if (cached.conn) {
    const readyState = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    console.log(`[DB][${timestamp}] Reusing cached connection (readyState=${readyState})`);

    // If the cached connection is actually disconnected, reset and reconnect
    if (readyState === 0 || readyState === 3) {
      console.warn(`[DB][${timestamp}] Cached connection is stale (readyState=${readyState}), reconnecting...`);
      cached.conn = null;
      cached.promise = null;
    } else {
      return cached.conn;
    }
  }

  // Return in-flight connection promise
  if (cached.promise) {
    console.log(`[DB][${timestamp}] Awaiting in-flight connection promise...`);
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      console.error(`[DB][${timestamp}] In-flight promise rejected:`, error);
      cached.promise = null;
      throw error;
    }
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error(`[DB][${timestamp}] MONGODB_URI is NOT defined in env!`);
    console.error(`[DB][${timestamp}] Available env keys:`, Object.keys(process.env).filter(k => k.includes("MONGO") || k.includes("DB")).join(", ") || "(none matched)");
    throw new Error(
      "MONGODB_URI is not defined in environment variables. " +
      "Add it to .env (see .env.example)."
    );
  }

  // Log masked URI for debugging (show protocol + host, mask credentials)
  const maskedUri = MONGODB_URI.replace(
    /\/\/([^:]+):([^@]+)@/,
    "//***:***@"
  );
  console.log(`[DB][${timestamp}] Connecting to: ${maskedUri}`);
  console.log(`[DB][${timestamp}] URI length: ${MONGODB_URI.length}, starts with: ${MONGODB_URI.substring(0, 14)}`);

  mongoose.set("strictQuery", true);

  const startTime = Date.now();

  cached.promise = mongoose
    .connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,  // 10s timeout for server selection
      connectTimeoutMS: 10000,          // 10s timeout for initial connection
    })
    .then((m) => {
      const elapsed = Date.now() - startTime;
      console.log(`[DB][${new Date().toISOString()}] ✅ Connected to MongoDB in ${elapsed}ms (readyState=${m.connection.readyState})`);
      return m;
    });

  try {
    cached.conn = await cached.promise;
  } catch (error: unknown) {
    cached.promise = null;
    const elapsed = Date.now() - startTime;
    console.error(`[DB][${new Date().toISOString()}] ❌ Connection FAILED after ${elapsed}ms`);
    console.error(`[DB] Error name:`, error instanceof Error ? error.name : "unknown");
    console.error(`[DB] Error message:`, error instanceof Error ? error.message : String(error));
    if (error instanceof Error && "code" in error) {
      console.error(`[DB] Error code:`, (error as Record<string, unknown>).code);
    }
    if (error instanceof Error && "reason" in error) {
      console.error(`[DB] Error reason:`, JSON.stringify((error as Record<string, unknown>).reason, null, 2));
    }
    console.error(`[DB] Full error:`, error);
    throw error;
  }

  return cached.conn;
}
