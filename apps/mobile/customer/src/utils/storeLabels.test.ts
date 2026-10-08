import { describe, expect, it } from "vitest";
import { districtOf, todayHoursLabel, vietnamWeekday } from "./storeLabels";

describe("districtOf", () => {
  it("returns the last address segment", () => {
    expect(districtOf("84 Đinh Tiên Hoàng, P. Đa Kao, Q.1")).toBe("Q.1");
    expect(districtOf("Chợ Bến Thành")).toBe("Chợ Bến Thành");
  });
});

describe("todayHoursLabel", () => {
  const hours = [
    { open: "06:30", close: "22:00" },
    null,
    null,
    null,
    null,
    null,
    null
  ];
  // 2026-10-04 23:30 UTC is Monday 06:30 in Vietnam.
  const mondayVn = new Date("2026-10-04T23:30:00Z");

  it("uses the Vietnam weekday", () => {
    expect(vietnamWeekday(mondayVn)).toBe(0);
  });

  it("describes today's hours or a day off", () => {
    expect(todayHoursLabel(hours, mondayVn)).toBe("Hôm nay 06:30–22:00");
    expect(todayHoursLabel(hours, new Date("2026-10-06T03:00:00Z"))).toBe(
      "Hôm nay nghỉ"
    );
    expect(todayHoursLabel(null, mondayVn)).toBeNull();
  });
});
