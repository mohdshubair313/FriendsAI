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

// Sarvam bulbul:v2 speakers are language-agnostic — the same speaker
// adapts prosody for every supported language. So the (style → speaker)
// mapping is uniform across all 11 locales, and we just expose the
// language entries for forward compatibility (in case a speaker becomes
// language-locked again later, or a regional voice is added).
const UNIFORM_V2: Record<VoiceStyleId, string> = {
  warm_female:    "anushka",
  confident_male: "abhilash",
  bright_playful: "kavya",
  calm_senior:    "ashutosh",
};

export const STYLE_TO_SARVAM_SPEAKER: Record<string, Partial<Record<VoiceStyleId, string>>> = {
  "hi-IN": UNIFORM_V2,
  "ta-IN": UNIFORM_V2,
  "te-IN": UNIFORM_V2,
  "bn-IN": UNIFORM_V2,
  "mr-IN": UNIFORM_V2,
  "gu-IN": UNIFORM_V2,
  "kn-IN": UNIFORM_V2,
  "ml-IN": UNIFORM_V2,
  "pa-IN": UNIFORM_V2,
  "od-IN": UNIFORM_V2,
  "en-IN": UNIFORM_V2,
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
