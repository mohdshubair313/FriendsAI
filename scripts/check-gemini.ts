// One real search request, no database writes. Never prints the configured key.
// Run: npx tsx --env-file=.env scripts/check-gemini.ts
import { HumanMessage } from "@langchain/core/messages";
import { streamGemini } from "../src/lib/chat/gemini";

async function main() {
  let tokens = 0, sources = 0, queries = 0, suggestions = false;
  const started = Date.now();
  await streamGemini({
    messages: [new HumanMessage("Search the web for the current stable Next.js version on its official website and answer in one sentence with a source.")],
    mood: null, webSearch: true,
    writer(event) {
      if (event.type === "token") tokens++;
      if (event.search) {
        sources = event.search.sources.length;
        queries = event.search.queries.length;
        suggestions = !!event.search.suggestionsHtml;
      }
    },
  });
  console.log(JSON.stringify({ tokens, sources, queries, suggestions, elapsedMs: Date.now() - started }));
  if (!sources) throw new Error("The provider returned no web sources for this search check.");
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
