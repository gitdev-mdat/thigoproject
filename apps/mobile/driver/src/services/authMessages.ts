import { AuthError } from "@thigo/auth-client";

export type RestoreFailure = "network" | "server";

/** A reachable API failure must not be presented as a device network issue. */
export function restoreFailureKind(error: unknown): RestoreFailure {
  return error instanceof AuthError &&
    (error.code === "network" || error.code === "timeout")
    ? "network"
    : "server";
}
