/** A per-checkout key; resubmitting with it can never create a second order. */
export function createIdempotencyKey(): string {
  const random = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  return `${Date.now().toString(36)}-${random()}-${random()}`;
}
