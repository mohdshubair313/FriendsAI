import { Subscription, TIER_FEATURES, TIER_QUOTAS, type Tier } from "@/models/Subscription";
import { connectToDb } from "@/lib/db";

/**
 * Entitlement — the single source of truth for what a user can do.
 * Computed from their Subscription document.
 */
export interface Entitlement {
  userId: string;
  tier: Tier;
  features: {
    imageGeneration: boolean;
    voiceConversational: boolean;
    advancedAgents: boolean;
    liveAvatar: boolean;
  };
  remaining: {
    imagesToday: number;
    voiceSecondsToday: number;
  };
}

/**
 * Build an Entitlement object for a user.
 * If no subscription exists, creates a free-tier one.
 */
export async function getEntitlement(userId: string): Promise<Entitlement> {
  await connectToDb();

  let sub = await Subscription.findOne({ userId });

  // Auto-create free-tier subscription if none exists
  if (!sub) {
    sub = await Subscription.create({
      userId,
      tier: "free",
      status: "active",
      features: TIER_FEATURES.free,
      quota: {
        imagesPerDay: TIER_QUOTAS.free.imagesPerDay,
        voiceMinutesPerDay: TIER_QUOTAS.free.voiceMinutesPerDay,
        consumedToday: { images: 0, voiceSeconds: 0, resetAt: new Date() },
      },
    });
  }

  // Reset daily quota if a new day has started
  const now = new Date();
  const resetAt = sub.quota.consumedToday.resetAt;
  if (resetAt && now.toDateString() !== resetAt.toDateString()) {
    sub.quota.consumedToday = { images: 0, voiceSeconds: 0, resetAt: now };
    await sub.save();
  }

  // Check if subscription is expired
  if (sub.status === "active" && sub.currentPeriodEnd < now) {
    sub.status = "expired";
    sub.tier = "free";
    sub.features = TIER_FEATURES.free;
    await sub.save();
  }

  return {
    userId,
    tier: sub.tier,
    features: {
      imageGeneration: sub.features.imageGeneration,
      voiceConversational: sub.features.voiceConversational,
      advancedAgents: sub.features.advancedAgents,
      liveAvatar: sub.features.liveAvatar,
    },
    remaining: {
      imagesToday: Math.max(0, sub.quota.imagesPerDay - sub.quota.consumedToday.images),
      voiceSecondsToday: Math.max(
        0,
        sub.quota.voiceMinutesPerDay * 60 - sub.quota.consumedToday.voiceSeconds
      ),
    },
  };
}

/**
 * Upgrade a user to Pro tier after successful payment.
 */
export async function upgradeToPro(
  userId: string,
  providerData?: { subscriptionId?: string; customerId?: string }
): Promise<Entitlement> {
  await connectToDb();

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await Subscription.findOneAndUpdate(
    { userId },
    {
      $set: {
        tier: "pro",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        features: TIER_FEATURES.pro,
        "quota.imagesPerDay": TIER_QUOTAS.pro.imagesPerDay,
        "quota.voiceMinutesPerDay": TIER_QUOTAS.pro.voiceMinutesPerDay,
        ...(providerData?.subscriptionId && {
          providerSubscriptionId: providerData.subscriptionId,
        }),
        ...(providerData?.customerId && {
          providerCustomerId: providerData.customerId,
        }),
      },
    },
    { upsert: true, new: true }
  );

  return getEntitlement(userId);
}

/**
 * Check if a specific feature is available for a user.
 */
export async function hasFeature(
  userId: string,
  feature: keyof Entitlement["features"]
): Promise<boolean> {
  const ent = await getEntitlement(userId);
  return ent.features[feature];
}
