import mongoose, { Schema, Types, Document } from "mongoose";

// ─── Locale ──────────────────────────────────────────────────────────────────
export interface IUserLocale {
  country: string;           // ISO-3166-1 alpha-2, e.g. "IN"
  state?: string;            // ISO-3166-2 sub-code, e.g. "IN-DL"
  city?: string;
  timezone?: string;         // IANA, e.g. "Asia/Kolkata"
  primaryLanguage: string;   // BCP-47, e.g. "hi-IN"
  secondaryLanguages?: string[];
  detectedFromIp?: boolean;
}

// ─── Consent ─────────────────────────────────────────────────────────────────
export interface IUserConsent {
  locationUse: boolean;
  sentimentLogging: boolean;
  trendingDataPersonalization: boolean;
  consentVersion: string;
  consentedAt: Date;
}

// ─── Preferences ─────────────────────────────────────────────────────────────
export type BuddyPersona =
  | "friendly"
  | "humorous"
  | "philosophical"
  | "romantic"
  | "motivational";

export interface IUserPreferences {
  buddyPersona: BuddyPersona;
  contentTaste?: { music?: string[]; shows?: string[]; games?: string[] };
  ttsVoiceId?: string;
  consent: IUserConsent;
}

// ─── User Interface ──────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  googleId?: string;
  githubId?: string;
  image?: string;

  // Locale & preferences (populated during onboarding)
  locale?: IUserLocale;
  preferences?: IUserPreferences;
  onboardingCompletedAt?: Date;

  /** @deprecated Use Subscription model instead */
  isPremium?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ─────────────────────────────────────────────────────────────
const localeSubSchema = new Schema<IUserLocale>(
  {
    country: { type: String, default: "IN" },
    state: String,
    city: String,
    timezone: String,
    primaryLanguage: { type: String, default: "en-IN" },
    secondaryLanguages: [String],
    detectedFromIp: Boolean,
  },
  { _id: false }
);

const consentSubSchema = new Schema<IUserConsent>(
  {
    locationUse: { type: Boolean, default: true },
    sentimentLogging: { type: Boolean, default: true },
    trendingDataPersonalization: { type: Boolean, default: true },
    consentVersion: { type: String, default: "v1.0" },
    consentedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const preferencesSubSchema = new Schema<IUserPreferences>(
  {
    buddyPersona: {
      type: String,
      enum: ["friendly", "humorous", "philosophical", "romantic", "motivational"],
      default: "friendly",
    },
    contentTaste: {
      music: [String],
      shows: [String],
      games: [String],
    },
    ttsVoiceId: String,
    consent: { type: consentSubSchema, default: () => ({}) },
  },
  { _id: false }
);

// ─── Main Schema ─────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [2, "Username must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      select: false,
      minlength: [6, "Password must be at least 6 characters"],
    },
    googleId: { type: String, index: true, unique: true, sparse: true },
    githubId: { type: String, index: true, unique: true, sparse: true },
    image: String,

    locale: { type: localeSubSchema, default: () => ({}) },
    preferences: { type: preferencesSubSchema, default: () => ({}) },
    onboardingCompletedAt: Date,

    /** @deprecated — kept for backward compat; use Subscription model */
    isPremium: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User =
  mongoose.models?.User || mongoose.model<IUser>("User", userSchema);