/**
 * Voice-Style Catalog — maps user-friendly style names to Sarvam speaker IDs
 * per language. The onboarding wizard's step 3 reads from here.
 *
 * Why generic styles ("Warm Female") instead of raw speaker names ("Meera"):
 *   - Users don't know Sarvam's voice roster
 *   - We can swap underlying speakers without the UI changing
 *   - Works gracefully when a speaker isn't available in a given language
 *     (e.g., we want a "Warm Female" voice but Sarvam only has Diya for
 *     Bengali — we fall back to Diya for that pair)
 */

export type VoiceStyleId = "warm_female" | "confident_male" | "bright_playful" | "calm_senior";

export interface VoiceStyle {
  id: VoiceStyleId;
  name: string;        // display label
  description: string; // shown under the chip
  emoji: string;
}

export const VOICE_STYLES: VoiceStyle[] = [
  {
    id: "warm_female",
    name: "Warm Female",
    description: "Friendly, conversational, easy to listen to.",
    emoji: "🌸",
  },
  {
    id: "confident_male",
    name: "Confident Male",
    description: "Calm, direct, professional tone.",
    emoji: "🎙️",
  },
  {
    id: "bright_playful",
    name: "Bright & Playful",
    description: "Energetic, lively, leans cheerful.",
    emoji: "✨",
  },
  {
    id: "calm_senior",
    name: "Calm Senior",
    description: "Lower-pitch, measured, grandparent-like.",
    emoji: "🧘",
  },
];

/**
 * Sarvam speaker ID per (style × language). When the exact combo isn't
 * available, we fall back to the language's default voice — see
 * voice-service/app/sarvam.py:DEFAULT_VOICE.
 *
 * The keys here mirror Sarvam's documented speaker names. The mapping is
 * intentionally conservative — when in doubt we route to the safest voice
 * for that language.
 */
export const STYLE_TO_SARVAM_SPEAKER: Record<string, Partial<Record<VoiceStyleId, string>>> = {
  "hi-IN": {
    warm_female:    "meera",
    confident_male: "arvind",
    bright_playful: "manisha",
    calm_senior:    "amol",
  },
  "ta-IN": {
    warm_female:    "pavithra",
    confident_male: "karun",
    bright_playful: "maya",
    calm_senior:    "karun",
  },
  "te-IN": {
    warm_female:    "maya",
    confident_male: "neel",
    bright_playful: "maya",
    calm_senior:    "neel",
  },
  "bn-IN": {
    warm_female:    "diya",
    confident_male: "amol",
    bright_playful: "diya",
    calm_senior:    "amol",
  },
  "mr-IN": {
    warm_female:    "manisha",
    confident_male: "amol",
    bright_playful: "manisha",
    calm_senior:    "amol",
  },
  "gu-IN": {
    warm_female:    "manisha",
    confident_male: "neel",
    bright_playful: "manisha",
    calm_senior:    "neel",
  },
  "kn-IN": {
    warm_female:    "pavithra",
    confident_male: "karun",
    bright_playful: "maya",
    calm_senior:    "karun",
  },
  "ml-IN": {
    warm_female:    "pavithra",
    confident_male: "arvind",
    bright_playful: "maya",
    calm_senior:    "arvind",
  },
  "pa-IN": {
    warm_female:    "manisha",
    confident_male: "amol",
    bright_playful: "manisha",
    calm_senior:    "amol",
  },
  "en-IN": {
    warm_female:    "meera",
    confident_male: "arvind",
    bright_playful: "manisha",
    calm_senior:    "amol",
  },
};

/**
 * Resolve a Sarvam speaker name from the user's saved (language, style).
 * Returns null when nothing is configured — the voice-service falls back
 * to its language default in that case.
 */
export function resolveSarvamSpeaker(
  language: string,
  styleId: VoiceStyleId | null | undefined
): string | null {
  if (!styleId) return null;
  return STYLE_TO_SARVAM_SPEAKER[language]?.[styleId] ?? null;
}
