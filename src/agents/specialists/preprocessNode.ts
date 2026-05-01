import { State } from "../state";
import { safetyNode } from "./safetyNode";
import { intentNode } from "./intentNode";

/**
 * Preprocess Node — runs safety + intent **in parallel**.
 *
 * Safety and intent are independent: neither reads what the other writes,
 * and they're both `state.messages → small LLM call → tiny state diff`.
 * Running them serially wasted ~3-5s on free OpenRouter tiers.
 *
 * Merge rules:
 *   • If safety blocks (`isSafe === false`), the intent result is discarded.
 *     The safety node also sets `messages`, `finalResponse`, `next: "FINISH"`,
 *     so the conditional edge after this node short-circuits to END.
 *   • Otherwise both diffs are merged. They have no overlapping keys
 *     (safety → `{isSafe}`; intent → `{intent}`) so order doesn't matter.
 */
export async function preprocessNode(state: State, config?: any) {
  const t0 = Date.now();
  const [safetyResult, intentResult] = await Promise.all([
    safetyNode(state, config),
    intentNode(state, config),
  ]);
  console.log(`[Preprocess] safety+intent in parallel: ${Date.now() - t0}ms`);

  if (safetyResult.isSafe === false) {
    return safetyResult;
  }

  return { ...intentResult, ...safetyResult };
}
