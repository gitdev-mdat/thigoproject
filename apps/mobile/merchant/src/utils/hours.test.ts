import { describe, expect, it } from "vitest";

import {
  applyToAll,
  dayErrors,
  formatTimeInput,
  fromDrafts,
  overnightHint,
  summarizeHours,
  toDrafts,
  todayHours,
  weekError
} from "./hours";

const week = (day: { open: string; close: string } | null) =>
  Array.from({ length: 7 }, () => day);

describe("time input", () => {
  it("inserts the colon while typing", () => {
    expect(formatTimeInput("8")).toBe("8");
    expect(formatTimeInput("083")).toBe("08:3");
    expect(formatTimeInput("0830")).toBe("08:30");
    expect(formatTimeInput("08:305")).toBe("08:30");
  });
});

describe("drafts", () => {
  it("starts every day open with defaults when there is no limit", () => {
    const days = toDrafts(null);
    expect(days).toHaveLength(7);
    expect(days.every((day) => !day.closed)).toBe(true);
  });

  it("round-trips API hours, keeping closed days null", () => {
    const hours = [...week({ open: "07:00", close: "21:00" })];
    hours[6] = null;
    expect(fromDrafts(toDrafts(hours))).toEqual(hours);
  });

  it("validates each open day", () => {
    const days = toDrafts(week({ open: "07:00", close: "21:00" }));
    days[0] = { closed: false, open: "7:0", close: "21:00" };
    days[1] = { closed: false, open: "21:00", close: "21:00" };
    days[2] = { closed: true, open: "", close: "" };
    days[4] = { closed: false, open: "18:00", close: "02:00" };
    days[5] = { closed: false, open: "08:00", close: "24:00" };
    days[6] = { closed: false, open: "24:00", close: "08:00" };
    const errors = dayErrors(days);
    expect(errors[0]).toMatch(/HH:MM/);
    expect(errors[1]).toBe("Giờ đóng cửa phải khác giờ mở cửa.");
    expect(errors[2]).toBeUndefined();
    expect(errors[3]).toBeUndefined();
    expect(errors[4]).toBeUndefined();
    expect(errors[5]).toBeUndefined();
    expect(errors[6]).toMatch(/HH:MM/);
  });

  it("hints when a window closes the next day", () => {
    expect(
      overnightHint({ closed: false, open: "18:00", close: "02:00" })
    ).toBe("Đóng cửa lúc 02:00 hôm sau");
    expect(
      overnightHint({ closed: false, open: "08:00", close: "24:00" })
    ).toBeUndefined();
    expect(
      overnightHint({ closed: true, open: "18:00", close: "02:00" })
    ).toBeUndefined();
  });

  it("requires at least one open day", () => {
    const closed = toDrafts(week(null)).map((day) => ({
      ...day,
      closed: true
    }));
    expect(weekError(closed)).toBeDefined();
    expect(weekError(toDrafts(null))).toBeUndefined();
  });

  it("copies one day to the whole week", () => {
    const days = toDrafts(null);
    days[0] = { closed: false, open: "06:30", close: "14:00" };
    expect(applyToAll(days, 0).every((day) => day.open === "06:30")).toBe(true);
  });
});

describe("summaries", () => {
  it("describes the week briefly", () => {
    expect(summarizeHours(null)).toBe("Không giới hạn giờ");
    expect(summarizeHours(week({ open: "07:00", close: "21:00" }))).toBe(
      "Mỗi ngày 07:00–21:00"
    );
    const sundayOff = [...week({ open: "07:00", close: "21:00" })];
    sundayOff[6] = null;
    expect(summarizeHours(sundayOff)).toBe("07:00–21:00 · Nghỉ Chủ nhật");
    expect(summarizeHours(week({ open: "18:00", close: "02:00" }))).toBe(
      "Mỗi ngày 18:00–02:00 (hôm sau)"
    );
  });

  it("reads today's window Monday-first", () => {
    const hours = [...week({ open: "07:00", close: "21:00" })];
    hours[6] = null;
    // 2026-10-11 is a Sunday; 2026-10-12 is a Monday.
    expect(todayHours(hours, new Date(2026, 9, 11, 9))).toBe("Hôm nay nghỉ");
    expect(todayHours(hours, new Date(2026, 9, 12, 9))).toBe(
      "Hôm nay 07:00–21:00"
    );
  });
});
