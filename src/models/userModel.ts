import mongoose from 'mongoose';

export interface IUser {
  username: string;
  email: string;
  password?: string;
  googleId?: string;
  githubId?: string;
  image?: string;
  isPremium?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        minlength: [2, 'Username must be at least 2 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },
    password: {
        type: String,
        select: false,
        minlength: [6, 'Password must be at least 6 characters'],
    },
    googleId: {
        type: String,
        index: true,
        unique: true,
        sparse: true,
    },
    githubId: {
        type: String,
        index: true,
        unique: true,
        sparse: true,
    },
    image: {
        type: String,
    },
    isPremium: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

export const User = mongoose.models?.User || mongoose.model<IUser>('User', userSchema);