import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'your_connection_string_here';

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
}

let isConnected: boolean = false;

export async function connectToDatabase() {
    if (isConnected) {
        console.log('Already connected to the database.');
        return;
    }

    try {
        const db = await mongoose.connect(MONGODB_URI, {
        });
        isConnected = !!db.connections[0].readyState;
        console.log('Connected to the database.');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}
