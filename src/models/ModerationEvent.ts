import mongoose, { Schema, Types, Document } from "mongoose";

export interface IModerationEvent extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  mediaJobId?: Types.ObjectId;
  contentType: "text" | "image" | "audio";
  source: "user" | "agent";
  flaggedContent: string;
  categories: {
    hateSpeech: boolean;
    selfHarm: boolean;
    sexual: boolean;
    violence: boolean;
    harassment: boolean;
  };
  severity: "low" | "medium" | "high" | "critical";
  actionTaken: "blocked" | "warned" | "flagged_for_review";
  reviewed: boolean;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
}

const moderationEventSchema = new Schema<IModerationEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", index: true },
    mediaJobId: { type: Schema.Types.ObjectId, ref: "MediaJob" },
    contentType: { type: String, enum: ["text", "image", "audio"], required: true },
    source: { type: String, enum: ["user", "agent"], required: true },
    flaggedContent: { type: String, required: true },
    categories: {
      hateSpeech: { type: Boolean, default: false },
      selfHarm: { type: Boolean, default: false },
      sexual: { type: Boolean, default: false },
      violence: { type: Boolean, default: false },
      harassment: { type: Boolean, default: false },
    },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], required: true },
    actionTaken: { type: String, enum: ["blocked", "warned", "flagged_for_review"], required: true },
    reviewed: { type: Boolean, default: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

moderationEventSchema.index({ createdAt: -1 });
moderationEventSchema.index({ reviewed: 1, severity: 1 });

export const ModerationEvent =
  mongoose.models?.ModerationEvent ||
  mongoose.model<IModerationEvent>("ModerationEvent", moderationEventSchema);
