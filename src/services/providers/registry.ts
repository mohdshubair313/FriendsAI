/**
 * Provider Registry — Policy-Driven Model Router
 *
 * Maps logical task types to concrete provider/model IDs. Callers ask for a
 * task ("chat_standard", "safety", ...) and get back a fully-configured model
 * spec without having to know which vendor / API key is in play.
 *
 * Why this matters in this codebase:
 *   - Free OpenRouter tiers vary wildly in latency. We pick small, fast,
 *     free-tier models for low-stakes tasks (safety, intent classification,
 *     sentiment) and larger models only where reasoning depth pays off.
 *   - Vercel Hobby has a 10s function timeout. The chat surface MUST stay
 *     under that. Models below were chosen so a single chat turn (one LLM
 *     call) returns first token in 1-3s on free tier.
 */

export type TaskType =
  | "supervisor"
  | "sentiment"
  | "intent"
  | "safety"
  | "recommendation"
  | "chat_standard"
  | "chat_complex"
  | "image_generation"
  | "image_classification"
  | "voice_tts"
  | "voice_stt";

export type ProviderName = "google" | "nvidia" | "openrouter" | "pollinations";

export interface ModelConfig {
  provider: ProviderName;
  modelId: string;
  description: string;
  tier: "free" | "pro" | "any";
  costPer1kTokensUsd?: number;
  expectedLatencyMs?: number;
  maxTokens?: number;
  temperature?: number;
}

export interface RoutingPolicy {
  maxCostUsd: number;
  maxLatencyMs: number;
  requiresPremium: boolean;
}

// ─── Model Choices (Free Tier, Optimized for Speed) ──────────────────────────
//
// CHAT (`chat_standard`):
//   `google/gemini-2.0-flash-exp:free` — typically returns first token in
//   1-2s and streams ~50 tok/s. Best free option for conversational use.
//
// CLASSIFIERS (`safety`, `intent`, `sentiment`):
//   `meta-llama/llama-3.2-3b-instruct:free` — 3B params is enough for
//   classification, easily fits in 1-2s. Was nvidia/nemotron-120b which
//   was overkill (and slow).
//
// HEAVY REASONING (`chat_complex`):
//   Kept on a larger free model. Used rarely (only when chat path explicitly
//   asks for deep reasoning — currently unwired).
//
// IMAGES (`image_generation`):
//   `pollinations/flux` — Pollinations.ai is a free, no-auth image gen
//   service. URLs are deterministic per-prompt, can be embedded directly.
//   Worker stores the URL in MediaJob, frontend renders <img src=url>.
//
const MODEL_REGISTRY: Record<TaskType, { primary: ModelConfig; fast: ModelConfig; cheap: ModelConfig }> = {
  supervisor: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Smart routing", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 800, temperature: 0.1 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Fast router", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 600, temperature: 0.1 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Free router", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 600 },
  },

  sentiment: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Sentiment classifier", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 800, temperature: 0 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Fast sentiment", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 600, temperature: 0 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Free sentiment", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 600, temperature: 0 },
  },

  intent: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Intent classifier", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 800, temperature: 0 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Fast intent", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 600, temperature: 0 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Cheap intent", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 600, temperature: 0 },
  },

  safety: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Safety classifier", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 800, temperature: 0 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Fast safety", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 600, temperature: 0 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Free safety", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 600, temperature: 0 },
  },

  recommendation: {
    primary: { provider: "openrouter", modelId: "google/gemini-2.0-flash-exp:free", description: "Content suggestions", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 1500, temperature: 0.7 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Fast suggestions", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 800, temperature: 0.7 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Free suggestions", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 800, temperature: 0.7 },
  },

  // The conversational core. NVIDIA Nemotron 30B nano-omni reasoning —
  // verified to first-token in ~2-3s on the free tier without 429s.
  // The actual fallback chain (with cobuddy + nemotron-120b) lives in
  // src/lib/chat/streamChat.ts.
  chat_standard: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Main chat (Nemotron 30B)", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 2500, temperature: 0.7 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Fast chat", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 2500, temperature: 0.7 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Cheap chat", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 2500, temperature: 0.7 },
  },

  // Reserved for explicit "think hard" prompts. Larger Nemotron gives
  // deeper reasoning at the cost of higher latency.
  chat_complex: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Deep reasoning (Nemotron 120B)", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 2500, temperature: 0.5 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Fast reasoning (Nemotron 30B)", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 1500, temperature: 0.5 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", description: "Cheap reasoning", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 1000, temperature: 0.5 },
  },

  // Pollinations.ai gives free, no-auth image gen via deterministic URLs.
  // No API key needed — the worker builds the URL and stores it in MediaJob.
  image_generation: {
    primary: { provider: "pollinations", modelId: "flux", description: "Pollinations Flux", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 6000 },
    fast: { provider: "pollinations", modelId: "turbo", description: "Pollinations Turbo", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 3000 },
    cheap: { provider: "pollinations", modelId: "turbo", description: "Pollinations Turbo", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 3000 },
  },

  image_classification: {
    primary: { provider: "google", modelId: "gemini-2.0-flash-exp", description: "Gemini Vision", tier: "any", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 1000 },
    fast: { provider: "google", modelId: "gemini-2.0-flash-exp", description: "Gemini Vision", tier: "any", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 1000 },
    cheap: { provider: "google", modelId: "gemini-2.0-flash-exp", description: "Gemini Vision", tier: "any", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 1000 },
  },

  voice_tts: {
    primary: { provider: "openrouter", modelId: "openai/tts-1-hd", description: "High-def TTS", tier: "pro", costPer1kTokensUsd: 0.03, expectedLatencyMs: 800 },
    fast: { provider: "openrouter", modelId: "openai/tts-1", description: "Fast TTS", tier: "pro", costPer1kTokensUsd: 0.015, expectedLatencyMs: 400 },
    cheap: { provider: "google", modelId: "gemini-2.0-flash-exp", description: "No dedicated TTS fallback", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 1000 },
  },

  voice_stt: {
    primary: { provider: "google", modelId: "gemini-2.0-flash-exp", description: "Gemini native STT", tier: "pro", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 600 },
    fast: { provider: "google", modelId: "gemini-2.0-flash-exp", description: "Gemini native STT", tier: "pro", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 600 },
    cheap: { provider: "google", modelId: "gemini-2.0-flash-exp", description: "Gemini native STT", tier: "pro", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 600 },
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

export function routeModel(task: TaskType, policy?: Partial<RoutingPolicy>): ModelConfig {
  const entry = MODEL_REGISTRY[task];
  if (!policy) return entry.primary;

  if (!policy.requiresPremium && entry.primary.tier === "pro" && entry.cheap.tier !== "pro") {
    return entry.cheap;
  }
  if (policy.maxLatencyMs && (entry.primary.expectedLatencyMs ?? 0) > policy.maxLatencyMs) {
    return entry.fast;
  }
  if (policy.maxCostUsd && (entry.primary.costPer1kTokensUsd ?? 0) > policy.maxCostUsd) {
    return entry.cheap;
  }
  return entry.primary;
}

export function getProviderApiKey(provider: ProviderName): string | null {
  const keyMap: Record<ProviderName, string> = {
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
    nvidia: process.env.NVIDIA_API_KEY || "",
    openrouter: process.env.OPENROUTER_API_KEY || "",
    // Pollinations is keyless — anyone can call it. No env var needed.
    pollinations: "no-key-required",
  };
  return keyMap[provider] || null;
}

export function hasProviderKey(provider: ProviderName): boolean {
  const key = getProviderApiKey(provider);
  return !!key && key.length > 0;
}
