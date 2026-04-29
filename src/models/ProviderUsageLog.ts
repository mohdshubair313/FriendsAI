import mongoose, { Schema, Types, Document } from "mongoose";
import { ProviderName, TaskType } from "@/services/providers/registry";

export interface IProviderUsageLog extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  provider: ProviderName;
  modelId: string;
  taskType: TaskType;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  latencyMs: number;
  costUsd: number;
  status: "success" | "error" | "fallback_triggered";
  errorDetails?: string;
  createdAt: Date;
}

const providerUsageLogSchema = new Schema<IProviderUsageLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", index: true },
    provider: { type: String, required: true, index: true },
    modelId: { type: String, required: true },
    taskType: { type: String, required: true },
    tokens: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    latencyMs: { type: Number, required: true },
    costUsd: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["success", "error", "fallback_triggered"],
      required: true,
    },
    errorDetails: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

providerUsageLogSchema.index({ createdAt: -1 });

export const ProviderUsageLog =
  mongoose.models?.ProviderUsageLog ||
  mongoose.model<IProviderUsageLog>("ProviderUsageLog", providerUsageLogSchema);
