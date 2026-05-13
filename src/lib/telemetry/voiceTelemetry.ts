import { Types } from "mongoose";
import { VoiceMetric } from "@/models/VoiceMetric";
import { connectToDb } from "@/lib/db";

/**
 * Fire-and-forget metric writer. Never throws — telemetry must never
 * affect the user-visible response path.
 *
 * Usage from a route handler:
 *   void recordTurnMetric({ userId, conversationId, ttft_ms: ..., ... });
 *
 * Mongo `insertOne` is fast (~10ms on a warm connection) but we deliberately
 * don't await it from the request loop. The trade-off is that on a server
 * crash mid-write we lose at most one metric row — acceptable.
 */

export interface TurnMetricInput {
  userId: string;
  conversationId?: string | null;
  stt_ms?: number;
  ttft_ms?: number;
  llm_ms?: number;
  tts_ms?: number;
  total_ms?: number;
  provider_stt?: string | null;
  provider_tts?: string | null;
  model_used?: string | null;
  persona?: string | null;
  locale?: string | null;
  expression?: string | null;
}

export async function recordTurnMetric(input: TurnMetricInput): Promise<void> {
  try {
    await connectToDb();
    await VoiceMetric.create({
      userId: new Types.ObjectId(input.userId),
      conversationId: input.conversationId
        ? new Types.ObjectId(input.conversationId)
        : undefined,
      ts: new Date(),
      stt_ms: input.stt_ms ?? 0,
      ttft_ms: input.ttft_ms ?? 0,
      llm_ms: input.llm_ms ?? 0,
      tts_ms: input.tts_ms ?? 0,
      total_ms: input.total_ms ?? 0,
      provider_stt: input.provider_stt ?? undefined,
      provider_tts: input.provider_tts ?? undefined,
      model_used: input.model_used ?? undefined,
      persona: input.persona ?? undefined,
      locale: input.locale ?? undefined,
      expression: input.expression ?? undefined,
    });
  } catch (err) {
    // Swallow — telemetry failures must never bubble to the user.
    console.warn("[voiceTelemetry] recordTurnMetric failed:", err);
  }
}

/**
 * Build a W3C Server-Timing header string from phase durations.
 * Browsers visualise this natively in DevTools → Network → Timing.
 */
export function buildServerTiming(phases: Record<string, number>): string {
  return Object.entries(phases)
    .filter(([, ms]) => ms > 0)
    .map(([name, ms]) => `${name};dur=${Math.round(ms)}`)
    .join(", ");
}
