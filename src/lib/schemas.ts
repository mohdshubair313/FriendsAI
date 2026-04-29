import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(30).trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Feedback Schema ─────────────────────────────────────────────────────────

export const feedbackSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  email: z.string().email("Invalid email address").trim(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000).trim(),
});

// ─── Input Sanitization Helper ──────────────────────────────────────────────

function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<script)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/eval\s*\(/gi, "")
    .trim();
}

function isValidContentType(content: any): boolean {
  if (typeof content === "string") return content.length <= 4000;
  if (Array.isArray(content)) {
    return content.every(part => {
      if (part.type === "text") return part.text?.length <= 3800;
      if (part.type === "image_url") return !!part.image_url?.url || !!part.image_url;
      return true;
    });
  }
  return false;
}

// ─── Chat Generate Schema ───────────────────────────────────────────────────

// ─── Chat Generate Schema ───────────────────────────────────────────────────

export const generateSchema = z.object({
  messages: z.array(z.any())
    .min(1, "At least one message required")
    .max(50, "Maximum 50 messages per request"),
  mood: z.string().optional().default("friendly"),
  conversationId: z.string().optional(),
});

// ─── Payment Schemas ─────────────────────────────────────────────────────────

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// ─── Locale & Preferences Schemas ────────────────────────────────────────────

export const localeSchema = z.object({
  country: z.string().length(2, "Country must be ISO-3166-1 alpha-2"),
  state: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  primaryLanguage: z.string().min(2, "Language code required"),
  secondaryLanguages: z.array(z.string()).optional(),
});

export const preferencesSchema = z.object({
  buddyPersona: z.enum([
    "friendly",
    "humorous",
    "philosophical",
    "romantic",
    "motivational",
  ]),
  contentTaste: z
    .object({
      music: z.array(z.string()).optional(),
      shows: z.array(z.string()).optional(),
      games: z.array(z.string()).optional(),
    })
    .optional(),
  ttsVoiceId: z.string().optional(),
  consent: z.object({
    locationUse: z.boolean(),
    sentimentLogging: z.boolean(),
    trendingDataPersonalization: z.boolean(),
  }),
});

export const onboardingSchema = z.object({
  locale: localeSchema,
  preferences: preferencesSchema,
});

// ─── Type Exports ────────────────────────────────────────────────────────────

export type SignupInput = z.infer<typeof signupSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type GenerateInput = z.infer<typeof generateSchema>;
export type LocaleInput = z.infer<typeof localeSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
