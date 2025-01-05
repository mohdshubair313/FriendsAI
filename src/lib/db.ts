import mongoose from "mongoose";

let isConnected = false; // Track the connection

export const connectToDb = async () => {
  if (isConnected) return;

  if (mongoose.connection.readyState === 0) {
    try {
      const db = await mongoose.connect(process.env.MONGO_URI as string, {
      });
      isConnected = db.connection.readyState === 1; // Set connection flag
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }
};
