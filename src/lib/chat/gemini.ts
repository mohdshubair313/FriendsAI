import type { BaseMessage } from "@langchain/core/messages";
import { buildChatSystemPrompt } from "./systemPrompt";
import type { SearchResult } from "./message-ui";

type Grounding = {
  webSearchQueries?: string[];
  searchEntryPoint?: { renderedContent?: string };
  groundingChunks?: { web?: { uri?: string; title?: string } }[];
  groundingSupports?: { segment?: { endIndex?: number; text?: string }; groundingChunkIndices?: number[] }[];
};
type GeminiChunk = {
  error?: { message?: string };
  promptFeedback?: { blockReason?: string };
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    groundingMetadata?: Grounding;
    finishReason?: string;
  }[];
};
export type GeminiEvent = { type: string; content?: string; search?: SearchResult };
export class GeminiRequestError extends Error {
  constructor(public readonly status: number) {
    super(`Gemini request failed (HTTP ${status}). Check the API key, model access and quota.`);
  }
}

export function geminiApiKey() {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
}

export function groundedAnswer(text: string, grounding: Grounding) {
  const sources: SearchResult["sources"] = [];
  const urls = new Map<number, string>();
  grounding.groundingChunks?.forEach((chunk, index) => {
    try {
      const url = new URL(chunk.web?.uri ?? "");
      if (!["https:", "http:"].includes(url.protocol)) return;
      urls.set(index, url.href);
      sources.push({ id: String(index + 1), title: chunk.web?.title || url.hostname, url: url.href });
    } catch { /* Ignore malformed provider URLs. */ }
  });
  const inserts = new Map<number, Set<number>>();
  for (const support of grounding.groundingSupports ?? []) {
    let end = support.segment?.endIndex;
    const segment = support.segment?.text;
    // Exact segment text also handles provider byte offsets for Hindi/emoji.
    if (segment && (end === undefined || text.slice(end - segment.length, end) !== segment)) {
      const start = text.lastIndexOf(segment);
      if (start >= 0) end = start + segment.length;
      else continue;
    }
    if (end === undefined || end < 0 || end > text.length) continue;
    const indices = inserts.get(end) ?? new Set<number>();
    support.groundingChunkIndices?.forEach((index) => { if (urls.has(index)) indices.add(index); });
    inserts.set(end, indices);
  }
  let content = text;
  for (const [end, indices] of [...inserts].sort(([a], [b]) => b - a)) {
    const citations = [...indices].map((index) => `[${index + 1}](<${urls.get(index)}>)`).join(" ");
    if (citations) content = content.slice(0, end) + ` ${citations}` + content.slice(end);
  }
  return {
    content,
    search: {
      sources,
      queries: grounding.webSearchQueries ?? [],
      suggestionsHtml: grounding.searchEntryPoint?.renderedContent,
    } satisfies SearchResult,
  };
}

/** Native Gemini streaming + Google Search. Keys and provider requests stay server-side. */
export async function streamGemini(options: {
  messages: BaseMessage[]; mood: string | null; persona?: string | null;
  expression?: string | null; webSearch?: boolean; signal?: AbortSignal;
  writer: (event: GeminiEvent) => void;
}) {
  const key = geminiApiKey();
  if (!key) throw new Error("Gemini is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY on the server.");
  const model = process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite";
  const signal = AbortSignal.any([AbortSignal.timeout(45_000), ...(options.signal ? [options.signal] : [])]);
  signal.throwIfAborted();
  if (options.webSearch) options.writer({ type: "search_start" });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildChatSystemPrompt(options) }] },
      contents: options.messages.filter((message) => message.getType() !== "system").map((message) => ({
        role: message.getType() === "ai" ? "model" : "user",
        parts: [{ text: typeof message.content === "string" ? message.content : JSON.stringify(message.content) }],
      })),
      generationConfig: { maxOutputTokens: 2048 },
      ...(options.webSearch ? { tools: [{ google_search: {} }] } : {}),
    }),
  });
  if (!response.ok || !response.body) {
    // Do not leak upstream response bodies or credentials into client errors/logs.
    throw new GeminiRequestError(response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", text = "";
  let grounding: Grounding = {};
  let finishReason: string | undefined;
  const readFrame = (frame: string) => {
    const data = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
    if (!data || data === "[DONE]") return;
    const chunk = JSON.parse(data) as GeminiChunk;
    if (chunk.error) throw new Error("Gemini could not complete this response.");
    if (chunk.promptFeedback?.blockReason) throw new Error("Gemini could not respond to this request.");
    const candidate = chunk.candidates?.[0];
    if (candidate?.finishReason) finishReason = candidate.finishReason;
    if (candidate?.groundingMetadata) grounding = { ...grounding, ...candidate.groundingMetadata };
    for (const part of candidate?.content?.parts ?? []) {
      if (!part.text || part.thought) continue;
      text += part.text;
      options.writer({ type: "token", content: part.text });
    }
  };
  try {
    while (true) {
      signal.throwIfAborted();
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      frames.forEach(readFrame);
      if (done) { if (buffer.trim()) readFrame(buffer); break; }
    }
    if (!text || !finishReason) throw new Error("Gemini ended before completing the response. Please try again.");
    if (!["STOP", "MAX_TOKENS"].includes(finishReason)) throw new Error("Gemini could not complete this response.");
    if (options.webSearch) {
      const result = groundedAnswer(text, grounding);
      options.writer({ type: "search_done", ...result });
      return result.content;
    }
    return text;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
