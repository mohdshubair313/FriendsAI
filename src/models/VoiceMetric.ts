import mongoose, { Schema, Types, Document } from "mongoose";

/**
 * One row per voice/chat turn. Aggregated server-side to power latency
 * dashboards — "p95 STT latency for hi-IN over the last 7 days", etc.
 *
 * Schema is deliberately denormalised: every row contains every dimension
 * we'd group by. Index hits are cheap because most queries are bounded by
 * (userId, ts) — both indexed.
 */

export interface IVoiceMetric extends Document {
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  ts: Date;

  // Phase latencies (ms). Any may be 0 if that phase didn't run.
  stt_ms: number;
  ttft_ms: number;     // time from request start to first LLM token
  llm_ms: number;      // total LLM streaming duration
  tts_ms: number;      // sum across all TTS chunks for this turn
  total_ms: number;    // end-to-end turn time

  // Routing dimensions
  provider_stt?: string;   // "sarvam" | "cloudflare" | null
  provider_tts?: string;
  model_used?: string;     // OpenRouter model id

  // Context dimensions (great for slicing dashboards)
  persona?: string;
  locale?: string;
  expression?: string;

  createdAt: Date;
}

const voiceMetricSchema = new Schema<IVoiceMetric>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    ts: { type: Date, default: Date.now, index: true },

    stt_ms: { type: Number, default: 0 },
    ttft_ms: { type: Number, default: 0 },
    llm_ms: { type: Number, default: 0 },
    tts_ms: { type: Number, default: 0 },
    total_ms: { type: Number, default: 0 },

    provider_stt: String,
    provider_tts: String,
    model_used: String,

    persona: String,
    locale: String,
    expression: String,
  },
  { timestamps: true }
);

// Compound index for the common "last 24h for this user" query.
voiceMetricSchema.index({ userId: 1, ts: -1 });

export const VoiceMetric =
  mongoose.models?.VoiceMetric ||
  mongoose.model<IVoiceMetric>("VoiceMetric", voiceMetricSchema);
