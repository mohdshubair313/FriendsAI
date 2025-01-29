export const runtime = "nodejs";

import mongoose from "mongoose";

let isConnected = false; // Global flag to track connection

export const connectToDb = async () => {
  if (isConnected) {
    console.log("MongoDB already connected!");
    return;
  }

  try {
    // Connect without deprecated options
    const db = await mongoose.connect(process.env.MONGODB_URI as string);

    isConnected = db.connection.readyState === 1; // 1 means connected
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error; // Throw error to handle it in API or middleware
  }
};
