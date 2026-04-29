/**
 * Provider Registry — Policy-Driven Router
 *
 * Chooses the best AI model based on:
 *   - Task complexity
 *   - Cost constraints (free vs pro tier limits)
 *   - Latency targets
 *
 * Supported providers:
 *   - Google (Gemini): Low latency, good reasoning, multimodal.
 *   - NVIDIA (NIM): High-end vision and object detection.
 *   - OpenRouter: Gateway to best-in-class open source and proprietary (e.g. Llama 3, Claude).
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

export type ProviderName = "google" | "nvidia" | "openrouter";

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

// ─── Routing Policy & Thresholds ─────────────────────────────────────────────

export interface RoutingPolicy {
  maxCostUsd: number;
  maxLatencyMs: number;
  requiresPremium: boolean;
}

// ─── Model Database ──────────────────────────────────────────────────────────

// Using free OpenRouter models to avoid Google API quota issues
const MODEL_REGISTRY: Record<TaskType, { primary: ModelConfig; fast: ModelConfig; cheap: ModelConfig }> = {
  supervisor: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Smart routing", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 600, temperature: 0.1 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Fast router", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 300, temperature: 0.1 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Free router", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 300 },
  },
  
  sentiment: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Deep sentiment", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 500, temperature: 0 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Fast sentiment", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 250, temperature: 0 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Free sentiment", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 250, temperature: 0 },
  },

  intent: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Intent classification", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 500, temperature: 0 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Fast intent", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 250, temperature: 0 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Cheap intent", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 250, temperature: 0 },
  },

  safety: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Safety check", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 400, temperature: 0 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Fast safety", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 400, temperature: 0 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Free safety", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 400, temperature: 0 },
  },

  recommendation: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Content suggestions", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 800, temperature: 0.7 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Content suggestions", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 800, temperature: 0.7 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Free suggestions", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 400, temperature: 0.7 },
  },

  chat_standard: {
    primary: { provider: "openrouter", modelId: "minimax/minimax-m2.5:free", description: "Main conversationalist", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 1200, temperature: 0.7 },
    fast: { provider: "openrouter", modelId: "minimax/minimax-m2.5:free", description: "Fast chat", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 800, temperature: 0.7 },
    cheap: { provider: "openrouter", modelId: "minimax/minimax-m2.5:free", description: "Free chat", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 1000, temperature: 0.7 },
  },

  chat_complex: {
    primary: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Deep reasoning", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 2500, temperature: 0.5 },
    fast: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Fast reasoning", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 1500, temperature: 0.5 },
    cheap: { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free", description: "Free reasoning", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 1500, temperature: 0.5 },
  },

  image_generation: {
    primary: { provider: "openrouter", modelId: "black-forest-labs/flux-1-schnell", description: "High-quality generation", tier: "pro", costPer1kTokensUsd: 0.03, expectedLatencyMs: 5000 },
    fast: { provider: "openrouter", modelId: "black-forest-labs/flux-1-schnell", description: "Fast generation", tier: "pro", costPer1kTokensUsd: 0.03, expectedLatencyMs: 5000 },
    cheap: { provider: "openrouter", modelId: "stabilityai/sdxl-turbo", description: "Cheap generation", tier: "pro", costPer1kTokensUsd: 0.005, expectedLatencyMs: 2000 },
  },

  image_classification: {
    primary: { provider: "nvidia", modelId: "nvidia/neva-22b", description: "NVIDIA Vision", tier: "pro", costPer1kTokensUsd: 0.002, expectedLatencyMs: 1500 },
    fast: { provider: "google", modelId: "gemini-2.0-flash", description: "Gemini Vision", tier: "any", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 1000 },
    cheap: { provider: "google", modelId: "gemini-2.0-flash", description: "Gemini Vision", tier: "any", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 1000 },
  },

  voice_tts: {
    primary: { provider: "openrouter", modelId: "openai/tts-1-hd", description: "High-def TTS", tier: "pro", costPer1kTokensUsd: 0.03, expectedLatencyMs: 800 },
    fast: { provider: "openrouter", modelId: "openai/tts-1", description: "Fast TTS", tier: "pro", costPer1kTokensUsd: 0.015, expectedLatencyMs: 400 },
    cheap: { provider: "google", modelId: "gemini-2.0-flash", description: "No dedicated TTS fallback", tier: "any", costPer1kTokensUsd: 0, expectedLatencyMs: 1000 },
  },

  voice_stt: {
    primary: { provider: "google", modelId: "gemini-2.0-flash", description: "Gemini native STT", tier: "pro", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 600 },
    fast: { provider: "google", modelId: "gemini-2.0-flash", description: "Gemini native STT", tier: "pro", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 600 },
    cheap: { provider: "google", modelId: "gemini-2.0-flash", description: "Gemini native STT", tier: "pro", costPer1kTokensUsd: 0.0001, expectedLatencyMs: 600 },
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the optimal model based on the policy constraints.
 */
export function routeModel(task: TaskType, policy?: Partial<RoutingPolicy>): ModelConfig {
  const entry = MODEL_REGISTRY[task];
  
  if (!policy) return entry.primary;

  // 1. Enforce premium constraint
  if (!policy.requiresPremium && entry.primary.tier === "pro" && entry.cheap.tier !== "pro") {
    return entry.cheap;
  }

  // 2. Latency constraint
  if (policy.maxLatencyMs && entry.primary.expectedLatencyMs! > policy.maxLatencyMs) {
    return entry.fast;
  }

  // 3. Cost constraint
  if (policy.maxCostUsd && entry.primary.costPer1kTokensUsd! > policy.maxCostUsd) {
    return entry.cheap;
  }

  return entry.primary;
}

export function getProviderApiKey(provider: ProviderName): string | null {
  const keyMap: Record<ProviderName, string> = {
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
    nvidia: process.env.NVIDIA_API_KEY || "",
    openrouter: process.env.OPENROUTER_API_KEY || "",
  };
  return keyMap[provider] || null;
}

export function hasProviderKey(provider: ProviderName): boolean {
  const key = getProviderApiKey(provider);
  return !!key && key.length > 0;
}
