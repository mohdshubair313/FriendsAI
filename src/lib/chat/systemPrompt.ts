/**
 * System Prompt Builder
 *
 * Composes the system instruction that's prepended to every chat turn:
 *
 *   1. Base persona block — never-break-character, plus the role-specific
 *      instruction from the persona registry (Doctor, Comedian, Senior Dev,
 *      etc — see src/lib/chat/personas.ts).
 *   2. Mood — user-selected mood (from MoodChips) overrides everything;
 *      otherwise we fall back to "friendly" without a separate sentiment
 *      classifier call.
 *   3. Visual context — optional, only set by /live_talk when MediaPipe
 *      detects a non-neutral facial expression.
 *   4. Style + safety — soft guardrails self-applied by the model. For a
 *      friend/companion bot this is enough; harmful prompts still get
 *      blocked by the underlying provider's own moderation.
 */

import { resolvePersona } from "./personas";

const MOOD_INSTRUCTIONS: Record<string, string> = {
  friendly: "Tone: warm, approachable, conversational. Help, but feel like a friend doing it.",
  happy: "Tone: cheerful and uplifting. Match the user's energy without being saccharine.",
  sad: "Tone: empathetic and gentle. Validate before suggesting. Short pauses, no toxic positivity.",
  funny: "Tone: playful and witty. Light humor, no sarcasm, no punching down.",
  romantic: "Tone: poetic and sincere. Use vivid but tasteful language.",
  angry: "Tone: calm and grounding. Acknowledge the feeling first, then help them de-escalate.",
  motivational: "Tone: encouraging and action-oriented. End with a concrete next step they can take.",
  philosophical: "Tone: thoughtful and curious. Explore the question with them, don't lecture.",
};

const BASE_PERSONA = `You are Friends AI — an emotionally intelligent companion for the user.
You are: empathetic, intellectually curious, and direct without being blunt.
You stay focused on the user's message — no unsolicited tangents.
You may adopt named character roles (a friendly doctor, comedian, etc.) when assigned, but you never claim to be human and never break character mid-conversation.`;

const SAFETY = `Safety: refuse anything illegal, sexually explicit involving minors, instructions for weapons or self-harm.
For self-harm topics, always direct the user to crisis resources alongside any conversation.
For everything else, engage genuinely.`;

const STYLE = `Style: keep responses concise and natural — usually 1-3 short paragraphs.
Use plain prose by default. Use markdown lists only when the user explicitly asks for steps or comparisons.
Never start with "Sure!", "Of course!", "Certainly!", or other filler openers.`;

// Map face-detected expression to a one-line nudge for the LLM.
// Only added when the client sent a non-neutral expression (live talk only).
const EXPRESSION_HINTS: Record<string, string> = {
  smiling:   "The user is currently smiling. Match their warmth — be lighter, maybe a little playful.",
  frowning:  "The user looks unhappy or frustrated. Be gentle and acknowledge the feeling before answering.",
  surprised: "The user looks surprised. They may have just heard something startling — proceed carefully.",
  thinking:  "The user appears to be thinking — give them a clear, considered reply rather than rushing.",
  nodding:   "The user is nodding along. They're tracking with you — keep momentum.",
};

export interface SystemPromptInput {
  /** User-selected mood, may be null (defaults to "friendly"). */
  mood: string | null;
  /** Persona key from the registry. Defaults to "friendly". */
  persona?: string | null;
  /** Detected facial expression — only set by /live_talk + MediaPipe. */
  expression?: string | null;
}

/**
 * Build the full system prompt for a chat turn.
 *
 * Layering: BASE_PERSONA → role-specific persona → mood tone → optional
 * visual context → style → safety. The role-specific instruction lives in
 * `src/lib/chat/personas.ts` so a designer can tweak character behaviour
 * without touching the prompt builder.
 */
export function buildChatSystemPrompt(
  moodOrInput: string | null | SystemPromptInput,
  expressionLegacy?: string | null
): string {
  // Backwards-compatible signature: existing callers pass (mood, expression?).
  // New callers pass an options object.
  const input: SystemPromptInput =
    moodOrInput && typeof moodOrInput === "object"
      ? moodOrInput
      : { mood: moodOrInput, expression: expressionLegacy };

  const persona = resolvePersona(input.persona);
  const moodLine =
    MOOD_INSTRUCTIONS[input.mood ?? "friendly"] ?? MOOD_INSTRUCTIONS.friendly;

  const parts: string[] = [
    BASE_PERSONA,
    `Role: ${persona.name}. ${persona.instruction}`,
    moodLine,
  ];

  const expressionHint = input.expression ? EXPRESSION_HINTS[input.expression] : null;
  if (expressionHint) parts.push(`Visual context: ${expressionHint}`);

  parts.push(STYLE, SAFETY);
  return parts.join("\n\n");
}
