/**
 * Structural equality for plain form drafts: primitives, arrays and plain
 * objects. A key holding `undefined` equals a missing key.
 */
export function sameDraft(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false;
    return a.every((item, index) => sameDraft(item, b[index]));
  }
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => sameDraft(left[key], right[key]));
}

/** True when the draft differs from the state it was opened with. */
export function isDirty<T>(saved: T, draft: T): boolean {
  return !sameDraft(saved, draft);
}
