import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { groundedAnswer, streamGemini, type GeminiEvent } from "./gemini";

const metadata = {
  webSearchQueries: ["a test query"],
  groundingChunks: [{ web: { uri: "https://example.com/a", title: "Source A" } }, { web: { uri: "javascript:alert(1)" } }],
  groundingSupports: [{ segment: { text: "Hello नमस्ते", endIndex: 99 }, groundingChunkIndices: [0, 1, 20] }],
  searchEntryPoint: { renderedContent: '<a href="https://google.com/search?q=test">Search</a>' },
};

describe("Gemini grounded streaming", () => {
  beforeEach(() => { vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key"); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  const options = (writer: (event: GeminiEvent) => void) => ({ messages: [new HumanMessage("test")], mood: null, writer });

  it("keeps Unicode citation placement, ignores unsafe URLs and preserves suggestions", () => {
    const result = groundedAnswer("Hello नमस्ते", metadata);
    expect(result.content).toBe("Hello नमस्ते [1](<https://example.com/a>)");
    expect(result.search.sources).toHaveLength(1);
    expect(result.search.suggestionsHtml).toContain("google.com/search");
  });

  it("streams split UTF-8 SSE, skips thought text, enables search and emits actual grounding", async () => {
    const frames = [
      { candidates: [{ content: { parts: [{ text: "internal", thought: true }, { text: "Hello नमस्ते" }] } }] },
      { candidates: [{ groundingMetadata: metadata, finishReason: "STOP" }] },
    ];
    const bytes = new TextEncoder().encode(frames.map((frame) => `data: ${JSON.stringify(frame)}\r\n\r\n`).join(""));
    const fetchMock = vi.fn().mockResolvedValue(new Response(new ReadableStream({ start(controller) {
      for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
      controller.close();
    } })));
    vi.stubGlobal("fetch", fetchMock);
    const events: GeminiEvent[] = [];
    const answer = await streamGemini({ ...options((event) => events.push(event)), webSearch: true });
    expect(answer).toContain("[1](<https://example.com/a>)");
    expect(events.map((event) => event.type)).toEqual(["search_start", "token", "search_done"]);
    expect(events[1].content).toBe("Hello नमस्ते");
    const request = fetchMock.mock.calls[0][1];
    expect(JSON.parse(request.body).tools).toEqual([{ google_search: {} }]);
    expect(request.headers["x-goog-api-key"]).toBe("test-key");
    expect(fetchMock.mock.calls[0][0]).not.toContain("test-key");
  });

  it("does not claim sources when the model chose not to search", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hi" }] }, finishReason: "STOP" }] })}\n\n`)));
    const events: GeminiEvent[] = [];
    await streamGemini({ ...options((event) => events.push(event)), webSearch: true });
    expect(events.at(-1)?.search?.sources).toEqual([]);
  });

  it("omits the tool when Search is off", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('data: {"candidates":[{"content":{"parts":[{"text":"Hi"}]},"finishReason":"STOP"}]}\n\n'));
    vi.stubGlobal("fetch", fetchMock);
    expect(await streamGemini(options(() => {}))).toBe("Hi");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).tools).toBeUndefined();
  });

  it("reports provider quota failures without returning the upstream body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private provider details", { status: 429 })));
    await expect(streamGemini(options(() => {}))).rejects.toThrow("HTTP 429");
  });

  it("rejects a truncated stream instead of marking it complete", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('data: {"candidates":[{"content":{"parts":[{"text":"Partial"}]}}]}\n\n')));
    await expect(streamGemini(options(() => {}))).rejects.toThrow("ended before completing");
  });

  it("honors a pre-aborted request without calling the provider", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController(); controller.abort();
    await expect(streamGemini({ ...options(() => {}), signal: controller.signal })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
