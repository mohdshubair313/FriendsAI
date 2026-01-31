import mongoose from "mongoose";

// Global variable to track connection state
// This prevents multiple connections in development with hot reload
let isConnected = false;

export const connectToDb = async () => {
  // Check if already connected
  if (isConnected) {
    console.log("MongoDB already connected!");
    return;
  }

  // Check if mongoose is already connected
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    console.log("MongoDB already connected (readyState: 1)!");
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    // Set mongoose options for better stability
    mongoose.set('strictQuery', true);
    
    // Connect without deprecated options
    const db = await mongoose.connect(MONGODB_URI);

    isConnected = db.connection.readyState === 1; // 1 means connected
    console.log("Connected to MongoDB!");
    
    // Handle connection events
    db.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    db.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    isConnected = false;
    throw error; // Throw error to handle it in API or middleware
  }
};
