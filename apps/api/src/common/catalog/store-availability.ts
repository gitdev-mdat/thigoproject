import type { OpeningHours } from "../../entities/catalog/store.entity.js";

/** Vietnam has no daylight saving time, so a fixed offset is exact. */
const VIETNAM_OFFSET_MINUTES = 7 * 60;
const TIME = /^(?:([01]\d|2[0-3]):([0-5]\d)|(24):(00))$/;

export type StoreClosedReason = "UNPUBLISHED" | "PAUSED" | "OUTSIDE_HOURS";

export interface StoreAvailabilityInput {
  isActive: boolean;
  isAcceptingOrders: boolean;
  openingHours: OpeningHours | null;
}

export function minutesOf(time: string): number {
  const match = TIME.exec(time);
  if (!match) throw new Error(`Invalid time ${time}`);
  return Number(match[1] ?? match[3]) * 60 + Number(match[2] ?? match[4]);
}

/** "24:00" is accepted only as a closing time. */
export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME.test(value);
}

/** Monday = 0 … Sunday = 6, with minutes since midnight, in Vietnam time. */
export function vietnamClock(now: Date): { day: number; minutes: number } {
  const local = new Date(now.getTime() + VIETNAM_OFFSET_MINUTES * 60_000);
  return {
    day: (local.getUTCDay() + 6) % 7,
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes()
  };
}

export function withinOpeningHours(
  hours: OpeningHours | null,
  now: Date
): boolean {
  if (!hours) return true;
  const { day, minutes } = vietnamClock(now);
  const today = hours[day];
  if (today) {
    const open = minutesOf(today.open);
    const close = minutesOf(today.close);
    // A close at or before the opening time means the store closes after midnight.
    if (close > open ? minutes >= open && minutes < close : minutes >= open)
      return true;
  }
  const yesterday = hours[(day + 6) % 7];
  return (
    !!yesterday &&
    minutesOf(yesterday.close) < minutesOf(yesterday.open) &&
    minutes < minutesOf(yesterday.close)
  );
}

/** Why customers cannot order from this store right now, or null when they can. */
export function storeClosedReason(
  store: StoreAvailabilityInput,
  now: Date = new Date()
): StoreClosedReason | null {
  if (!store.isActive) return "UNPUBLISHED";
  if (!store.isAcceptingOrders) return "PAUSED";
  if (!withinOpeningHours(store.openingHours, now)) return "OUTSIDE_HOURS";
  return null;
}
