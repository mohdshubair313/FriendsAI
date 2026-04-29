import mongoose, { Schema, Types, Document } from "mongoose";

export interface IUserPreferencesModel extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  locale: string; // e.g. "en-US", "hi-IN"
  timezone: string; // e.g. "Asia/Kolkata"
  primaryLanguage: string;
  voicePreference: string; // e.g. "alloy", "echo"
  avatarPreference: string; // e.g. "default", "anime", "realistic"
  consentSettings: {
    dataProcessing: boolean;
    sentimentTracking: boolean;
    marketingEmails: boolean;
  };
  updatedAt: Date;
}

const userPreferencesSchema = new Schema<IUserPreferencesModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    locale: { type: String, default: "en-US" },
    timezone: { type: String, default: "UTC" },
    primaryLanguage: { type: String, default: "en" },
    voicePreference: { type: String, default: "alloy" },
    avatarPreference: { type: String, default: "default" },
    consentSettings: {
      dataProcessing: { type: Boolean, default: true },
      sentimentTracking: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const UserPreferences =
  mongoose.models?.UserPreferences ||
  mongoose.model<IUserPreferencesModel>("UserPreferences", userPreferencesSchema);
