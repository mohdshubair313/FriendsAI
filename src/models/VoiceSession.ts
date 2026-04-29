import mongoose, { Schema, Types, Document } from "mongoose";

export interface IVoiceSession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId: Types.ObjectId;
  status: "active" | "ended" | "dropped";
  startedAt: Date;
  endedAt?: Date;
  totalDurationMs: number;
  totalTokensUsed: number;
}

const voiceSessionSchema = new Schema<IVoiceSession>(
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
    totalTokensUsed: { type: Number, default: 0 },
  },
  { timestamps: false }
);

export const VoiceSession =
  mongoose.models?.VoiceSession ||
  mongoose.model<IVoiceSession>("VoiceSession", voiceSessionSchema);
