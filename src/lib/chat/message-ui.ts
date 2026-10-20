export type ReplyState = "thinking" | "researching" | "writing" | "done" | "error" | "stopped" | "generating" | "uploading";

export type SearchSource = { id: string; title: string; url: string };
export type SearchResult = {
  pending?: boolean;
  sources: SearchSource[];
  queries: string[];
  suggestionsHtml?: string;
};

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  status?: ReplyState;
  search?: SearchResult;
  image?: { url: string | null; prompt: string };
  annotations?: Array<{ type: string; data: unknown }>;
};

/** These are links in the answer, not a claim that a web search took place. */
export function linkedSources(markdown: string) {
  const sources = new Map<string, { id: string; title: string; url: string }>();
  for (const match of markdown.matchAll(/(?<!!)\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g)) {
    try {
      const url = new URL(match[2]);
      if (!sources.has(url.href)) sources.set(url.href, {
        id: url.href, title: match[1], url: url.href,
      });
    } catch { /* Ignore incomplete streaming links. */ }
  }
  return [...sources.values()];
}
