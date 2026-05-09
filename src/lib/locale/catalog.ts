/**
 * Locale Catalog — supported (country, language) pairs for Phase 1.
 *
 * Phase 1 supports only what Cloudflare MeloTTS actually speaks. When
 * Sarvam AI lands in Phase 3 we'll layer hi/ta/te/bn/mr/gu/kn/ml/pa on
 * top — the catalog will grow but the shape stays the same.
 *
 *   country  : ISO 3166-1 alpha-2 (e.g. "IN")
 *   language : BCP-47 (e.g. "hi-IN" — language + region)
 *   ttsLang  : MeloTTS language code (en/es/fr/zh/jp/kr — the only ones
 *              the model accepts today). When ttsLang is null, TTS
 *              degrades to English fallback.
 *
 * Adding a new pair: just extend COUNTRIES and LANGUAGES below. The UI
 * picks them up automatically.
 */

export interface CountryOption {
  code: string;        // ISO 3166-1 alpha-2
  name: string;
  flag: string;        // emoji
  /** Languages spoken in this country, in display order. */
  languages: string[]; // BCP-47 codes — must exist in LANGUAGES below
}

export interface LanguageOption {
  code: string;        // BCP-47, e.g. "hi-IN"
  name: string;        // "Hindi"
  /** STT input hint — Whisper accepts ISO-639-1 ("en", "hi", "fr"). */
  sttLang: string;
  /** TTS output language — null falls back to English. */
  ttsLang: "en" | "es" | "fr" | "zh" | "jp" | "kr" | null;
}

export const COUNTRIES: CountryOption[] = [
  { code: "US", name: "United States",   flag: "🇺🇸", languages: ["en-US", "es-MX"] },
  // India: 9 Sarvam-supported languages. Hindi first (most common).
  { code: "IN", name: "India",           flag: "🇮🇳", languages: [
    "hi-IN", "en-IN", "ta-IN", "te-IN", "bn-IN", "mr-IN", "gu-IN", "kn-IN", "ml-IN", "pa-IN",
  ]},
  { code: "GB", name: "United Kingdom",  flag: "🇬🇧", languages: ["en-GB"] },
  { code: "ES", name: "Spain",           flag: "🇪🇸", languages: ["es-ES", "en-US"] },
  { code: "FR", name: "France",          flag: "🇫🇷", languages: ["fr-FR", "en-US"] },
  { code: "DE", name: "Germany",         flag: "🇩🇪", languages: ["en-US"] },
  { code: "JP", name: "Japan",           flag: "🇯🇵", languages: ["ja-JP", "en-US"] },
  { code: "CN", name: "China",           flag: "🇨🇳", languages: ["zh-CN", "en-US"] },
  { code: "KR", name: "South Korea",     flag: "🇰🇷", languages: ["ko-KR", "en-US"] },
  { code: "MX", name: "Mexico",          flag: "🇲🇽", languages: ["es-MX", "en-US"] },
];

export const LANGUAGES: Record<string, LanguageOption> = {
  "en-US": { code: "en-US", name: "English (US)",       sttLang: "en", ttsLang: "en" },
  "en-IN": { code: "en-IN", name: "English (India)",    sttLang: "en", ttsLang: "en" },
  "en-GB": { code: "en-GB", name: "English (UK)",       sttLang: "en", ttsLang: "en" },
  "es-ES": { code: "es-ES", name: "Español (España)",   sttLang: "es", ttsLang: "es" },
  "es-MX": { code: "es-MX", name: "Español (México)",   sttLang: "es", ttsLang: "es" },
  "fr-FR": { code: "fr-FR", name: "Français",           sttLang: "fr", ttsLang: "fr" },
  "ja-JP": { code: "ja-JP", name: "日本語 (Japanese)",   sttLang: "ja", ttsLang: "jp" },
  "zh-CN": { code: "zh-CN", name: "中文 (Mandarin)",    sttLang: "zh", ttsLang: "zh" },
  "ko-KR": { code: "ko-KR", name: "한국어 (Korean)",     sttLang: "ko", ttsLang: "kr" },
  // Indian languages — STT works via Whisper fallback OR Sarvam (when keyed).
  // ttsLang: null means "MeloTTS can't speak this; use Sarvam or fall back to en".
  "hi-IN": { code: "hi-IN", name: "हिन्दी (Hindi)",       sttLang: "hi", ttsLang: null },
  "ta-IN": { code: "ta-IN", name: "தமிழ் (Tamil)",        sttLang: "ta", ttsLang: null },
  "te-IN": { code: "te-IN", name: "తెలుగు (Telugu)",      sttLang: "te", ttsLang: null },
  "bn-IN": { code: "bn-IN", name: "বাংলা (Bengali)",      sttLang: "bn", ttsLang: null },
  "mr-IN": { code: "mr-IN", name: "मराठी (Marathi)",      sttLang: "mr", ttsLang: null },
  "gu-IN": { code: "gu-IN", name: "ગુજરાતી (Gujarati)",   sttLang: "gu", ttsLang: null },
  "kn-IN": { code: "kn-IN", name: "ಕನ್ನಡ (Kannada)",      sttLang: "kn", ttsLang: null },
  "ml-IN": { code: "ml-IN", name: "മലയാളം (Malayalam)",   sttLang: "ml", ttsLang: null },
  "pa-IN": { code: "pa-IN", name: "ਪੰਜਾਬੀ (Punjabi)",     sttLang: "pa", ttsLang: null },
};

export const DEFAULT_COUNTRY = "IN";
export const DEFAULT_LANGUAGE = "en-IN";

/**
 * Returns the languages available for a given country. Always includes
 * "en-US" as a fallback so the user is never stranded with no options.
 */
export function languagesForCountry(country: string): LanguageOption[] {
  const c = COUNTRIES.find((x) => x.code === country);
  const codes = c?.languages ?? ["en-US"];
  return codes.map((code) => LANGUAGES[code]).filter(Boolean);
}

/** Validate a (country, language) combo against the catalog. */
export function isValidPair(country: string, language: string): boolean {
  const c = COUNTRIES.find((x) => x.code === country);
  if (!c) return false;
  return c.languages.includes(language);
}

/** Resolve an STT (Whisper) input language code from a BCP-47 string. */
export function sttLangFor(language: string | null | undefined): string {
  if (!language) return "en";
  return LANGUAGES[language]?.sttLang ?? language.split("-")[0] ?? "en";
}

/** Resolve a TTS (MeloTTS) output language code, with English fallback. */
export function ttsLangFor(
  language: string | null | undefined
): "en" | "es" | "fr" | "zh" | "jp" | "kr" {
  if (!language) return "en";
  return LANGUAGES[language]?.ttsLang ?? "en";
}
