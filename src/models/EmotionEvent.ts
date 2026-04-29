import mongoose, { Schema, Types, Document } from "mongoose";

export interface IEmotionEvent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId: Types.ObjectId;
  messageId?: Types.ObjectId;
  score: number; // -1.0 to 1.0 (valence)
  arousal: number; // 0.0 to 1.0 (intensity)
  detectedMood: string; // e.g. "joy", "anger", "sadness", "neutral"
  contextTrigger?: string; // e.g. "discussed_career", "image_generation"
  timestamp: Date;
}

const emotionEventSchema = new Schema<IEmotionEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    messageId: { type: Schema.Types.ObjectId },
    score: { type: Number, required: true },
    arousal: { type: Number, required: true },
    detectedMood: { type: String, required: true },
    contextTrigger: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const EmotionEvent =
  mongoose.models?.EmotionEvent ||
  mongoose.model<IEmotionEvent>("EmotionEvent", emotionEventSchema);
