import { clsx, type ClassValue } from "clsx"
import mongoose from "mongoose"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const connectToDb = async () => {
  try {
    if (mongoose.connections &&  mongoose.connections[0].readyState) return;
    
    const {connection} = await mongoose.connect(process.env.MONGODB_URI as string, {
      dbName: process.env.MONGODB_DB,
    });
    console.log(`Connected to the database: ${connection.name}`)
  } catch (error) {
    throw new Error("Error connecting to the database")
  }
}
