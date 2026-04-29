import mongoose, { Schema, Types, Document } from "mongoose";

export type MediaJobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface IMediaJob extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId: Types.ObjectId;
  messageId?: Types.ObjectId;
  kind: "image" | "meme";
  status: MediaJobStatus;
  prompt: string;
  modelId: string;
  locale: { country: string; state?: string; city?: string };
  trendsSnapshotId?: Types.ObjectId;
  resultUrl?: string;
  thumbnailUrl?: string;
  costUsd?: number;
  error?: { code: string; message: string };
  attempts: number;
  createdAt: Date;
  finishedAt?: Date;
}

const mediaJobSchema = new Schema<IMediaJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    messageId: { type: Schema.Types.ObjectId, ref: "Message" },
    kind: { type: String, enum: ["image", "meme"], required: true },
    status: {
      type: String,
      enum: ["queued", "running", "succeeded", "failed", "cancelled"],
      default: "queued",
    },
    prompt: { type: String, required: true },
    modelId: { type: String, required: true },
    locale: {
      country: { type: String, required: true },
      state: String,
      city: String,
    },
    trendsSnapshotId: { type: Schema.Types.ObjectId },
    resultUrl: String,
    thumbnailUrl: String,
    costUsd: Number,
    error: {
      code: String,
      message: String,
    },
    attempts: { type: Number, default: 0 },
    finishedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

mediaJobSchema.index({ userId: 1, createdAt: -1 });
mediaJobSchema.index({ status: 1, createdAt: 1 });

export const MediaJob =
  mongoose.models?.MediaJob ||
  mongoose.model<IMediaJob>("MediaJob", mediaJobSchema);
