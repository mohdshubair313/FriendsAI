import mongoose, { Schema, Types, Document } from "mongoose";

// ─── Types ───────────────────────────────────────────────────────────────────
export type Tier = "free" | "pro";
export type SubStatus = "active" | "past_due" | "cancelled" | "expired";

export interface ISubscriptionFeatures {
  imageGeneration: boolean;
  voiceConversational: boolean;
  advancedAgents: boolean;
  liveAvatar: boolean;
}

export interface IQuotaConsumed {
  images: number;
  voiceSeconds: number;
  resetAt: Date;
}

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tier: Tier;
  status: SubStatus;
  provider: "razorpay";
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  features: ISubscriptionFeatures;
  quota: {
    imagesPerDay: number;
    voiceMinutesPerDay: number;
    consumedToday: IQuotaConsumed;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ─── Feature defaults by tier ────────────────────────────────────────────────
export const TIER_FEATURES: Record<Tier, ISubscriptionFeatures> = {
  free: {
    imageGeneration: false,
    voiceConversational: false,
    advancedAgents: false,
    liveAvatar: false,
  },
  pro: {
    imageGeneration: true,
    voiceConversational: true,
    advancedAgents: true,
    liveAvatar: true,
  },
};

export const TIER_QUOTAS: Record<Tier, { imagesPerDay: number; voiceMinutesPerDay: number }> = {
  free: { imagesPerDay: 0, voiceMinutesPerDay: 0 },
  pro: { imagesPerDay: 50, voiceMinutesPerDay: 60 },
};

// ─── Schema ──────────────────────────────────────────────────────────────────
const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    tier: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "past_due", "cancelled", "expired"],
      default: "active",
    },
    provider: { type: String, default: "razorpay" },
    providerSubscriptionId: String,
    providerCustomerId: String,
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    features: {
      imageGeneration: { type: Boolean, default: false },
      voiceConversational: { type: Boolean, default: false },
      advancedAgents: { type: Boolean, default: false },
      liveAvatar: { type: Boolean, default: false },
    },
    quota: {
      imagesPerDay: { type: Number, default: 0 },
      voiceMinutesPerDay: { type: Number, default: 0 },
      consumedToday: {
        images: { type: Number, default: 0 },
        voiceSeconds: { type: Number, default: 0 },
        resetAt: { type: Date, default: Date.now },
      },
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

export const Subscription =
  mongoose.models?.Subscription ||
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);
