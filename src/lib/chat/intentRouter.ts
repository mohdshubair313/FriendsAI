/**
 * Intent Router (regex, no LLM)
 *
 * Decides what kind of work a user message represents. Replaces the old
 * `intentNode` + `supervisorNode` LLM calls — those took 5-10s combined
 * on free OpenRouter to almost always answer "this is chat". Regex does
 * the same job in microseconds with zero false positives for our slash
 * commands.
 *
 * Returns:
 *   - "image": the user wants an image generated (slash command or imperative)
 *   - "chat":  default — falls through to direct LLM stream
 *
 * Voice / avatar / recommendation paths are handled by their own routes
 * (`/api/voice/*`, `/live_talk`, etc) and never reach the orchestrate route,
 * so we don't classify them here.
 */

export type ChatIntent = "chat" | "image";

const IMAGE_TRIGGERS: RegExp[] = [
  // Explicit slash command — primary path for image generation.
  /^\s*\/image\b/i,
  /^\s*\/img\b/i,
  /^\s*\/draw\b/i,
  /^\s*\/generate\b/i,
];

export function detectIntent(text: string): ChatIntent {
  if (!text) return "chat";
  for (const pattern of IMAGE_TRIGGERS) {
    if (pattern.test(text)) return "image";
  }
  return "chat";
}

/**
 * Strip the slash command prefix so the downstream image generator gets
 * just the prompt. e.g. "/image a calico cat" → "a calico cat".
 */
export function stripImagePrefix(text: string): string {
  return text
    .replace(/^\s*\/(image|img|draw|generate)\s*/i, "")
    .trim();
}
