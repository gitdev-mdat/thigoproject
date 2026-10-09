import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { likePattern } from "../../repositories/admin/admin.repository.js";
import { countsBy } from "../../services/admin/admin.service.js";
import {
  parseOrderListQuery,
  parsePage,
  parseStoreListQuery,
  parseUserListQuery
} from "./admin.dto.js";

describe("admin query parsing", () => {
  it("defaults to the first page of 20", () => {
    expect(parsePage({})).toEqual({ page: 1, pageSize: 20 });
    expect(parsePage({ page: "", pageSize: "" })).toEqual({
      page: 1,
      pageSize: 20
    });
  });

  it.each([
    { page: "0" },
    { page: "-1" },
    { page: "1.5" },
    { page: "abc" },
    { page: "1001" },
    { pageSize: "101" },
    { pageSize: "0" },
    { page: ["1", "2"] }
  ])("rejects an invalid page %o", (query) => {
    expect(() => parsePage(query)).toThrow(BadRequestException);
  });

  it("accepts only known filter values", () => {
    expect(parseOrderListQuery({ status: "DELIVERED" }).status).toBe(
      "DELIVERED"
    );
    expect(() => parseOrderListQuery({ status: "delivered" })).toThrow(
      BadRequestException
    );
    expect(parseStoreListQuery({ visibility: "hidden" }).visibility).toBe(
      "hidden"
    );
    expect(() => parseStoreListQuery({ category: "PIZZA" })).toThrow(
      BadRequestException
    );
    expect(parseUserListQuery({ role: "DRIVER" }).role).toBe("DRIVER");
    expect(() => parseUserListQuery({ role: "ROOT" })).toThrow(
      BadRequestException
    );
  });

  it("trims search terms and limits their length", () => {
    expect(parseOrderListQuery({ q: "  TG  " }).q).toBe("TG");
    expect(parseOrderListQuery({ q: "   " }).q).toBeUndefined();
    expect(() => parseOrderListQuery({ q: "x".repeat(81) })).toThrow(
      BadRequestException
    );
  });
});

describe("admin reporting helpers", () => {
  it("escapes LIKE wildcards so a search matches literally", () => {
    expect(likePattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
  });

  it("fills every key and ignores unknown groups", () => {
    expect(
      countsBy(["A", "B", "C"] as const, [
        { key: "A", count: 2 },
        { key: "Z", count: 9 }
      ])
    ).toEqual({ A: 2, B: 0, C: 0 });
  });
});
