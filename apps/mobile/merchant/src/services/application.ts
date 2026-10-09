import type { ApplicationInput, MyApplication } from "../types/application";
import { apiRequest } from "./api";

/** The signed-in phone's own partner application (no MERCHANT role needed). */
export function fetchMyApplication(): Promise<MyApplication> {
  return apiRequest<MyApplication>("/merchant-applications/me");
}

export function saveApplication(
  input: ApplicationInput
): Promise<MyApplication> {
  return apiRequest<MyApplication>("/merchant-applications/me", {
    method: "PUT",
    body: input
  });
}

export function submitApplication(): Promise<MyApplication> {
  return apiRequest<MyApplication>("/merchant-applications/me/submit", {
    method: "POST"
  });
}

/** Claims an approved application: grants the role and creates the store. */
export function activateApplication(): Promise<MyApplication> {
  return apiRequest<MyApplication>("/merchant-applications/me/activate", {
    method: "POST"
  });
}
