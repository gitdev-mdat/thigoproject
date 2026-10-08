import { describe, expect, it } from "vitest";
import { districtOf } from "./storeLabels";

describe("districtOf", () => {
  it("returns the last address segment", () => {
    expect(districtOf("84 Đinh Tiên Hoàng, P. Đa Kao, Q.1")).toBe("Q.1");
    expect(districtOf("Chợ Bến Thành")).toBe("Chợ Bến Thành");
  });
});
