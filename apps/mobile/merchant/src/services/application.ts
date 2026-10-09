import type { ApplicationInput, MyApplication } from "../types/application";
import type { MediaUpload } from "../types/storefront";
import { apiRequest } from "./api";
import { sessionStore } from "./auth";
import { apiBaseUrl } from "./config";
import { createImageUploader, type PickedImage } from "./media";

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

export type ApplicationImageKind = "LOGO" | "COVER" | "PHOTO";

/** Uploads a private review image to the signed-in applicant's application. */
export function uploadApplicationImage(
  kind: ApplicationImageKind
): (image: PickedImage) => Promise<MediaUpload> {
  return createImageUploader(apiBaseUrl, sessionStore.read, undefined, {
    path: "/merchant-applications/me/media",
    fields: { kind }
  });
}

export function deleteApplicationImage(id: string): Promise<void> {
  return apiRequest<void>(
    `/merchant-applications/me/media/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out +=
      BASE64[a >> 2]! +
      BASE64[((a & 3) << 4) | ((b ?? 0) >> 4)]! +
      (b === undefined ? "=" : BASE64[((b & 15) << 2) | ((c ?? 0) >> 6)]!) +
      (c === undefined ? "=" : BASE64[c & 63]!);
  }
  return out;
}

/**
 * Application images are private. Android's image loader does not reliably
 * send a session header, so the bytes are fetched with the session and
 * shown as a data URI that never leaves the device.
 */
export async function privateImageSource(
  url: string,
  fetcher: typeof fetch = (...args) => fetch(...args)
): Promise<{ uri: string } | undefined> {
  const token = await sessionStore.read();
  try {
    const response = await fetcher(`${apiBaseUrl}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) return undefined;
    const type = response.headers.get("content-type") ?? "image/jpeg";
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { uri: `data:${type};base64,${toBase64(bytes)}` };
  } catch {
    return undefined;
  }
}
