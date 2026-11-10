import { describe, expect, it } from "vitest";
import {
  storeClosedReason,
  vietnamClock,
  withinOpeningHours
} from "./store-availability.js";

// 2026-10-05 is a Monday. 01:30 UTC is 08:30 in Vietnam.
const mondayMorning = new Date("2026-10-05T01:30:00Z");
const hours = [
  { open: "07:00", close: "21:00" },
  null,
  null,
  null,
  null,
  null,
  { open: "08:00", close: "12:00" }
];

describe("store availability", () => {
  it("reads the clock in Vietnam time, Monday first", () => {
    expect(vietnamClock(mondayMorning)).toEqual({ day: 0, minutes: 510 });
    // Sunday 23:30 UTC is already Monday 06:30 in Vietnam.
    expect(vietnamClock(new Date("2026-10-04T23:30:00Z")).day).toBe(0);
  });

  it("checks today's window with the closing minute excluded", () => {
    expect(withinOpeningHours(hours, mondayMorning)).toBe(true);
    expect(withinOpeningHours(hours, new Date("2026-10-05T14:00:00Z"))).toBe(
      false
    );
    expect(withinOpeningHours(hours, new Date("2026-10-05T13:59:00Z"))).toBe(
      true
    );
    expect(withinOpeningHours(hours, new Date("2026-10-06T03:00:00Z"))).toBe(
      false
    );
    expect(withinOpeningHours(null, mondayMorning)).toBe(true);
  });

  it("runs overnight windows past midnight and accepts 24:00", () => {
    const late = [
      { open: "18:00", close: "02:00" },
      null,
      null,
      null,
      null,
      null,
      null
    ];
    // Monday 23:00 and Tuesday 01:30 in Vietnam are open; Tuesday 02:00 is not.
    expect(withinOpeningHours(late, new Date("2026-10-05T16:00:00Z"))).toBe(
      true
    );
    expect(withinOpeningHours(late, new Date("2026-10-05T18:30:00Z"))).toBe(
      true
    );
    expect(withinOpeningHours(late, new Date("2026-10-05T19:00:00Z"))).toBe(
      false
    );
    // Monday 01:00 is outside: Sunday is closed, Monday opens at 18:00.
    expect(withinOpeningHours(late, new Date("2026-10-04T18:00:00Z"))).toBe(
      false
    );
    const allDay = Array(7).fill({ open: "00:00", close: "24:00" });
    expect(withinOpeningHours(allDay, new Date("2026-10-05T16:59:00Z"))).toBe(
      true
    );
  });

  it("explains why a store cannot take orders", () => {
    const store = {
      isActive: true,
      isAcceptingOrders: true,
      openingHours: hours
    };
    expect(storeClosedReason(store, mondayMorning)).toBeNull();
    expect(
      storeClosedReason({ ...store, isActive: false }, mondayMorning)
    ).toBe("UNPUBLISHED");
    expect(
      storeClosedReason({ ...store, isAcceptingOrders: false }, mondayMorning)
    ).toBe("PAUSED");
    expect(storeClosedReason(store, new Date("2026-10-06T03:00:00Z"))).toBe(
      "OUTSIDE_HOURS"
    );
  });
});
