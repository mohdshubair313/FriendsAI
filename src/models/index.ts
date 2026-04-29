/**
 * Central model exports.
 * Import from "@/models" instead of individual files.
 */

export { User } from "./userModel";
export type { IUser, IUserLocale, IUserPreferences, IUserConsent, BuddyPersona } from "./userModel";

export { Subscription, TIER_FEATURES, TIER_QUOTAS } from "./Subscription";
export type { ISubscription, Tier, SubStatus, ISubscriptionFeatures } from "./Subscription";

export { Conversation, Message } from "./Conversation";
export type { IConversation, IMessage, MessagePart } from "./Conversation";

export { EmotionEvent } from "./EmotionEvent";
export type { IEmotionEvent } from "./EmotionEvent";

export { MediaJob } from "./MediaJob";
export type { IMediaJob, MediaJobStatus } from "./MediaJob";

export { ProviderUsageLog } from "./ProviderUsageLog";
export type { IProviderUsageLog } from "./ProviderUsageLog";

export { AvatarSession } from "./AvatarSession";
export type { IAvatarSession, AvatarState } from "./AvatarSession";

export { ModerationEvent } from "./ModerationEvent";
export type { IModerationEvent } from "./ModerationEvent";


export { UserPreferences } from "./UserPreferences";
export type { IUserPreferencesModel } from "./UserPreferences";

export { VoiceSession } from "./VoiceSession";
export type { IVoiceSession } from "./VoiceSession";

// Legacy — will be removed after migration
export { default as Chat } from "./ChatModel";
