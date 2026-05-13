import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { getProviderApiKey } from "@/services/providers/registry";
import { errMessage } from "@/lib/errors";
import { buildChatSystemPrompt } from "./systemPrompt";

/**
 * Direct LLM streaming for the chat path.
 *
 * Replaces a 4-5 sequential LLM call orchestration with a single streaming
 * call. Persona, mood guidance, and safety guardrails are baked into the
 * system prompt so we don't need separate classifier nodes.
 *
 * Three operational concerns the wrapper handles:
 *   1. Free-tier rate limits (429) AND silent hangs: each model gets a
 *      hard first-token deadline. If no token arrives in FIRST_TOKEN_DEADLINE_MS,
 *      we abort and try the next model in the chain. Without this, slow free
 *      providers can hang the whole route for 60s+ before erroring.
 *   2. Provider transients (5xx): also fall through the chain.
 *   3. Step-by-step tracing: every phase logs `[streamChat] ms=…` so we
 *      can pinpoint slowness in dev (provider latency vs internal work).
 */

export type StreamWriter = (chunk: { type: string; content?: string }) => void;

export interface StreamChatOptions {
  messages: BaseMessage[];
  mood: string | null;          // user-selected mood, may be null
  /** Detected facial expression from MediaPipe (live talk only). */
  expression?: string | null;
  /** Persona key from src/lib/chat/personas.ts. */
  persona?: string | null;
  signal?: AbortSignal;          // tied to request signal for stop button
  writer: StreamWriter;          // pushes `{ type: "token", content }` events
}

const FALLBACK_REPLY =
  "I'm having trouble responding right now — try sending that again in a moment.";

// Per-model first-token deadline. If a model hasn't started streaming
// by this point, abort and try the next one. 4s catches both the "provider
// hangs for 60s before 503" failure mode AND the "free tier rate-limited
// so it never responds" mode without burning user-visible time. Healthy
// free-tier models first-token in 1-2s — 4s leaves comfortable headroom.
const FIRST_TOKEN_DEADLINE_MS = 4_000;

// Hard ceiling on a single model's TOTAL response time. Once first-token
// arrives we let the stream run, but cap total time to keep a runaway
// generation from pinning the route for the full Vercel maxDuration.
const FULL_RESPONSE_DEADLINE_MS = 45_000;

/**
 * Ordered model fallback chain for the chat path.
 *
 * Free OpenRouter models hit per-model rate limits independently, so when
 * the primary returns 429 we transparently retry on the next one. List is
 * ordered by speed (fastest first), then quality.
 *
 * Cloudflare Workers AI is intentionally NOT in this chain — those Neurons
 * are reserved for image generation and the voice pipeline.
 *
 * To swap the chain, edit this list — there's intentionally no per-task
 * registry indirection here. Chat is the one path where fallback matters.
 */
// Order reflects current availability, not theoretical preference.
// Re-bench when the free tier rotates and reorder accordingly.
// Models starting with "@cf/" are dispatched to Cloudflare Workers AI
// instead of OpenRouter — see tryCloudflareModel below.
const CHAT_MODEL_CHAIN: Array<{ id: string; temperature: number }> = [
  // Primary: Cloudflare Llama 3.1 8B Instruct. Free + reliable + ~2s
  // first-token. Lives on our own CF account (same token as STT/TTS) so
  // we control the rate limits, unlike OpenRouter free where the whole
  // pool gets throttled. Verified: cuts cold chat from 10.5s → 2.5s.
  { id: "@cf/meta/llama-3.1-8b-instruct", temperature: 0.7 },
  // Fallback 1: Baidu CoBuddy. Free OpenRouter; sometimes faster than
  // CF Llama when CF is congested.
  { id: "baidu/cobuddy:free", temperature: 0.7 },
  // Fallback 2: NVIDIA Nemotron Nano Omni 30B. Multimodal, used when
  // CF + Baidu both miss.
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", temperature: 0.7 },
  // Fallback 3: large Nemotron — slow first-token but high quality;
  // last-resort safety net.
  { id: "nvidia/nemotron-3-super-120b-a12b:free", temperature: 0.7 },
];

/**
 * Convert LangChain BaseMessage[] to OpenAI-format role/content pairs that
 * Cloudflare Workers AI Llama models expect.
 */
function messagesToCfFormat(msgs: BaseMessage[]): Array<{ role: string; content: string }> {
  return msgs.map((m) => {
    const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    if (m instanceof SystemMessage) return { role: "system", content };
    if (m instanceof HumanMessage) return { role: "user", content };
    if (m instanceof AIMessage) return { role: "assistant", content };
    return { role: "user", content };
  });
}

/**
 * Stream from Cloudflare Workers AI. Mirrors tryOneModel's contract but
 * uses raw fetch + SSE parsing instead of LangChain (which has no CF
 * adapter). Honours the same deadlines via the shared AbortController.
 */
async function tryCloudflareModel(
  modelId: string,
  temperature: number,
  llmInput: BaseMessage[],
  userSignal: AbortSignal | undefined,
  writer: StreamWriter,
  t0: number
): Promise<{ ok: true; text: string } | { ok: false; transient: boolean; error: unknown }> {
  const tModelStart = Date.now();
  console.log(`[streamChat] try ${modelId} ${ms(t0)}`);

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return { ok: false, transient: false, error: new Error("cloudflare not configured") };
  }

  const childCtrl = new AbortController();
  const onUserAbort = () => childCtrl.abort();
  userSignal?.addEventListener("abort", onUserAbort);

  let firstTokenDeadlineHit = false;
  let totalDeadlineHit = false;
  const firstTokenTimer = setTimeout(() => { firstTokenDeadlineHit = true; childCtrl.abort(); }, FIRST_TOKEN_DEADLINE_MS);
  const totalTimer = setTimeout(() => { totalDeadlineHit = true; childCtrl.abort(); }, FULL_RESPONSE_DEADLINE_MS);

  let acc = "";
  let tokenCount = 0;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesToCfFormat(llmInput), stream: true, temperature, max_tokens: 1024 }),
        signal: childCtrl.signal,
      }
    );
    if (!res.ok || !res.body) {
      const txt = await res.text().catch(() => "");
      return { ok: false, transient: res.status >= 500 || res.status === 429, error: new Error(`CF HTTP ${res.status}: ${txt.slice(0, 200)}`) };
    }
    // Parse SSE: lines beginning with "data: " carry one JSON token chunk.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      if (userSignal?.aborted) break;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Each SSE event terminates with a blank line or single newline.
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const obj = JSON.parse(data);
          const token: string = obj.response ?? "";
          if (!token) continue;
          if (tokenCount === 0) {
            clearTimeout(firstTokenTimer);
            console.log(`[streamChat] first-token ${modelId} ${ms(tModelStart)}`);
          }
          tokenCount++;
          acc += token;
          writer({ type: "token", content: token });
        } catch {
          // ignore malformed JSON line
        }
      }
    }
    console.log(`[streamChat] ok ${modelId} chars=${acc.length} chunks=${tokenCount} model_time=${ms(tModelStart)} total=${ms(t0)}`);
    return { ok: true, text: acc };
  } catch (err) {
    if (userSignal?.aborted) throw err;
    if (firstTokenDeadlineHit) {
      console.warn(`[streamChat] timeout(first-token>${FIRST_TOKEN_DEADLINE_MS}ms) ${modelId} ${ms(tModelStart)}`);
      return { ok: false, transient: true, error: new Error("first_token_timeout") };
    }
    if (totalDeadlineHit) {
      if (acc) return { ok: true, text: acc };
      return { ok: false, transient: true, error: new Error("total_timeout") };
    }
    if (acc) return { ok: true, text: acc };
    return { ok: false, transient: true, error: err };
  } finally {
    clearTimeout(firstTokenTimer);
    clearTimeout(totalTimer);
    userSignal?.removeEventListener("abort", onUserAbort);
  }
}

function isRateLimit(err: unknown): boolean {
  const msg = errMessage(err).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("rate_limit") ||
    msg.includes("rate limit")
  );
}

function isProviderTransient(err: unknown): boolean {
  const msg = errMessage(err);
  return /\b5\d\d\b/.test(msg) || msg.toLowerCase().includes("provider returned error");
}

function ms(t0: number): string {
  return `${Date.now() - t0}ms`;
}

/**
 * Try one model. Resolves to:
 *   - { ok: true, text }                  — got a usable response
 *   - { ok: false, transient, error }     — failed; transient=true means worth fallback
 * Plus emits tokens to the writer as they arrive.
 *
 * Internally manages a child AbortController so the deadlines + the user's
 * stop signal both feed into the same cancellation. The user signal is the
 * only thing that triggers a hard abort up the call stack — deadlines
 * just convert to "fail this model, try next".
 */
async function tryOneModel(
  modelId: string,
  temperature: number,
  apiKey: string,
  llmInput: BaseMessage[],
  userSignal: AbortSignal | undefined,
  writer: StreamWriter,
  t0: number
): Promise<{ ok: true; text: string } | { ok: false; transient: boolean; error: unknown }> {
  const tModelStart = Date.now();
  console.log(`[streamChat] try ${modelId} ${ms(t0)}`);

  // Child controller — aborted if EITHER the user stops OR a deadline trips.
  const childCtrl = new AbortController();
  const onUserAbort = () => childCtrl.abort();
  userSignal?.addEventListener("abort", onUserAbort);

  // Reason flags so the catch block can tell deadline-abort from real error.
  let firstTokenDeadlineHit = false;
  let totalDeadlineHit = false;

  const firstTokenTimer = setTimeout(() => {
    firstTokenDeadlineHit = true;
    childCtrl.abort();
  }, FIRST_TOKEN_DEADLINE_MS);
  const totalTimer = setTimeout(() => {
    totalDeadlineHit = true;
    childCtrl.abort();
  }, FULL_RESPONSE_DEADLINE_MS);

  const llm = new ChatOpenAI({
    model: modelId,
    apiKey,
    temperature,
    streaming: true,
    // Fail fast — our chain is the retry mechanism, not LangChain's.
    maxRetries: 0,
    configuration: { baseURL: "https://openrouter.ai/api/v1" },
  });

  let acc = "";
  let tokenCount = 0;
  try {
    const stream = await llm.stream(llmInput, { signal: childCtrl.signal });
    for await (const chunk of stream) {
      if (userSignal?.aborted) break;
      const token = chunk.content?.toString() ?? "";
      if (!token) continue;
      if (tokenCount === 0) {
        // Got first token — clear the first-token deadline. Total deadline
        // still applies in case the body itself runs forever.
        clearTimeout(firstTokenTimer);
        console.log(`[streamChat] first-token ${modelId} ${ms(tModelStart)}`);
      }
      tokenCount++;
      acc += token;
      writer({ type: "token", content: token });
    }
    console.log(
      `[streamChat] ok ${modelId} chars=${acc.length} chunks=${tokenCount} model_time=${ms(tModelStart)} total=${ms(t0)}`
    );
    return { ok: true, text: acc };
  } catch (err) {
    if (userSignal?.aborted) {
      // Real user abort — propagate up so the route closes the SSE stream.
      throw err;
    }
    if (firstTokenDeadlineHit) {
      console.warn(`[streamChat] timeout(first-token>${FIRST_TOKEN_DEADLINE_MS}ms) ${modelId} ${ms(tModelStart)}`);
      return { ok: false, transient: true, error: new Error("first_token_timeout") };
    }
    if (totalDeadlineHit) {
      console.warn(`[streamChat] timeout(total>${FULL_RESPONSE_DEADLINE_MS}ms) ${modelId} ${ms(tModelStart)}`);
      // If we have partial text by now, treat as success — better than nothing.
      if (acc) return { ok: true, text: acc };
      return { ok: false, transient: true, error: new Error("total_timeout") };
    }
    const transient = isRateLimit(err) || isProviderTransient(err);
    console.warn(
      `[streamChat] fail ${modelId} (${transient ? "transient" : "fatal"}): ${errMessage(err)} ${ms(tModelStart)}`
    );
    // Partial response already streamed — better to keep what we have than
    // double-stream from the fallback (UI would glitch).
    if (acc) {
      console.warn(`[streamChat] returning partial (${acc.length} chars) — no fallback`);
      return { ok: true, text: acc };
    }
    return { ok: false, transient, error: err };
  } finally {
    clearTimeout(firstTokenTimer);
    clearTimeout(totalTimer);
    userSignal?.removeEventListener("abort", onUserAbort);
  }
}

/**
 * Stream a chat response, walking CHAT_MODEL_CHAIN until one model
 * actually produces tokens. Returns the full assistant text.
 */
export async function streamChat(opts: StreamChatOptions): Promise<string> {
  const { messages, mood, expression, persona, signal, writer } = opts;
  const t0 = Date.now();

  const apiKey = getProviderApiKey("openrouter");
  if (!apiKey) {
    console.warn(`[streamChat] no api key — emitting fallback ${ms(t0)}`);
    writer({ type: "token", content: FALLBACK_REPLY });
    return FALLBACK_REPLY;
  }

  const systemPrompt = new SystemMessage({
    content: buildChatSystemPrompt({ mood, persona, expression }),
  });
  const llmInput = [systemPrompt, ...messages];
  console.log(
    `[streamChat] start persona=${persona ?? "friendly"} mood=${mood ?? "auto"} expression=${expression ?? "n/a"} msgs=${messages.length} ${ms(t0)}`
  );

  let lastError: unknown = null;
  for (let i = 0; i < CHAT_MODEL_CHAIN.length; i++) {
    const { id, temperature } = CHAT_MODEL_CHAIN[i];
    const isLast = i === CHAT_MODEL_CHAIN.length - 1;

    const result = id.startsWith("@cf/")
      ? await tryCloudflareModel(id, temperature, llmInput, signal, writer, t0)
      : await tryOneModel(id, temperature, apiKey, llmInput, signal, writer, t0);
    if (result.ok) return result.text;

    lastError = result.error;
    if (!result.transient || isLast) break;
    // Otherwise loop into next model.
  }

  console.error(`[streamChat] all models failed total=${ms(t0)} lastErr=${errMessage(lastError)}`);
  writer({ type: "token", content: FALLBACK_REPLY });
  return FALLBACK_REPLY;
}
