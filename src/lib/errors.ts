/**
 * Tiny helpers for working with `unknown` errors out of `try/catch`.
 *
 * TypeScript (strict) types `catch (e)` as `unknown`, which is the right
 * default — the thrown value is genuinely arbitrary. These helpers narrow
 * it just enough to grab a message / code / name without sprinkling type
 * guards through every error branch.
 */

export function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export function errName(e: unknown): string {
  if (e instanceof Error) return e.name;
  if (e && typeof e === "object" && "name" in e) {
    const n = (e as { name: unknown }).name;
    if (typeof n === "string") return n;
  }
  return "";
}

export function errCode(e: unknown): string {
  if (e && typeof e === "object" && "code" in e) {
    const c = (e as { code: unknown }).code;
    if (typeof c === "string") return c;
  }
  return "";
}

export function isAbort(e: unknown): boolean {
  return errName(e) === "AbortError";
}
