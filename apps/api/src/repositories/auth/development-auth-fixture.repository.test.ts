import type { DataSource } from "typeorm";
import { describe, expect, it, vi } from "vitest";

import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import { DevelopmentAuthFixtureRepository } from "./development-auth-fixture.repository.js";

function insertBuilder() {
  const builder = {
    insert: vi.fn(),
    into: vi.fn(),
    values: vi.fn(),
    orIgnore: vi.fn(),
    execute: vi.fn(async () => ({
      identifiers: [],
      generatedMaps: [],
      raw: []
    }))
  };
  builder.insert.mockReturnValue(builder);
  builder.into.mockReturnValue(builder);
  builder.values.mockReturnValue(builder);
  builder.orIgnore.mockReturnValue(builder);
  return builder;
}

describe("DevelopmentAuthFixtureRepository", () => {
  it("uses conflict-safe inserts for both the user and required role", async () => {
    const userInsert = insertBuilder();
    const roleInsert = insertBuilder();
    const manager = {
      createQueryBuilder: vi
        .fn()
        .mockReturnValueOnce(userInsert)
        .mockReturnValueOnce(roleInsert),
      getRepository: vi.fn(() => ({
        findOneByOrFail: vi.fn(async () => ({ id: "user-id" }))
      }))
    };
    const dataSource = {
      transaction: vi.fn(async (operation) => operation(manager))
    } as unknown as DataSource;

    await new DevelopmentAuthFixtureRepository(dataSource).ensureAccount(
      "+84860000002",
      ApplicationRole.MERCHANT
    );

    expect(userInsert.values).toHaveBeenCalledWith({ phone: "+84860000002" });
    expect(userInsert.orIgnore).toHaveBeenCalledOnce();
    expect(roleInsert.values).toHaveBeenCalledWith({
      userId: "user-id",
      role: ApplicationRole.MERCHANT
    });
    expect(roleInsert.orIgnore).toHaveBeenCalledOnce();
  });
});
