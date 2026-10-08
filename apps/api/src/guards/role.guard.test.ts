import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext
} from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";
import { ApplicationRole } from "../entities/auth/user-role.entity.js";
import type { AuthService } from "../services/auth/auth.service.js";
import { RoleGuard } from "./role.guard.js";

function setup(
  required: ApplicationRole | undefined,
  roles: ApplicationRole[],
  authorization?: string
) {
  const request: Record<string, unknown> = { headers: { authorization } };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request })
  } as unknown as ExecutionContext;
  const reflector = {
    getAllAndOverride: vi.fn(() => required)
  } as unknown as Reflector;
  const authenticate = vi.fn(async () => ({
    user: {
      id: "u1",
      phone: "+84860000001",
      roles: roles.map((role) => ({ role }))
    }
  }));
  const guard = new RoleGuard(reflector, {
    authenticate
  } as unknown as AuthService);
  return { guard, context, request, authenticate };
}

describe("RoleGuard", () => {
  it("rejects a request without a bearer token", async () => {
    const { guard, context } = setup(ApplicationRole.CUSTOMER, []);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("rejects a session that lacks the required role", async () => {
    const { guard, context } = setup(
      ApplicationRole.MERCHANT,
      [ApplicationRole.CUSTOMER],
      "Bearer token"
    );
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it("fails closed when a route declares no role", async () => {
    const { guard, context, authenticate } = setup(
      undefined,
      [ApplicationRole.ADMIN],
      "Bearer token"
    );
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("attaches the authenticated user for the handler", async () => {
    const { guard, context, request, authenticate } = setup(
      ApplicationRole.DRIVER,
      [ApplicationRole.DRIVER],
      "Bearer abc"
    );
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(authenticate).toHaveBeenCalledWith("abc");
    expect(request.thigoUser).toEqual({ id: "u1", phone: "+84860000001" });
  });
});
