import mongoose, { Schema, Types, Document } from "mongoose";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface IAvatarSession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId: Types.ObjectId;
  status: "active" | "ended" | "dropped";
  startedAt: Date;
  endedAt?: Date;
  totalDurationMs: number;
  metrics: {
    averageLatencyMs: number;
    framesRendered: number;
    audioChunksProcessed: number;
    visemesGenerated: number;
  };
  webrtcInfo?: {
    roomId: string;
    serverRegion: string;
    connectionQuality: "excellent" | "good" | "poor";
  };
  persistence: {
    lastState: AvatarState;
    lastEmotion: string;
    lastPosition?: { x: number; y: number; z: number };
  };
}

const avatarSessionSchema = new Schema<IAvatarSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    status: {
      type: String,
      enum: ["active", "ended", "dropped"],
      default: "active",
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    totalDurationMs: { type: Number, default: 0 },
    metrics: {
      averageLatencyMs: { type: Number, default: 0 },
      framesRendered: { type: Number, default: 0 },
      audioChunksProcessed: { type: Number, default: 0 },
      visemesGenerated: { type: Number, default: 0 },
    },
    webrtcInfo: {
      roomId: String,
      serverRegion: String,
      connectionQuality: {
        type: String,
        enum: ["excellent", "good", "poor"],
      },
    },
    persistence: {
      lastState: { type: String, default: "idle" },
      lastEmotion: { type: String, default: "neutral" },
      lastPosition: {
        x: Number,
        y: Number,
        z: Number,
      },
    },
  },
  { timestamps: false } // Custom timestamps used instead
);

avatarSessionSchema.index({ status: 1, startedAt: -1 });

export const AvatarSession =
  mongoose.models?.AvatarSession ||
  mongoose.model<IAvatarSession>("AvatarSession", avatarSessionSchema);
