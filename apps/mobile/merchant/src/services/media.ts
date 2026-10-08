import type { MediaUpload } from "../types/storefront";
import { ApiError, NETWORK_MESSAGE } from "./api";
import { sessionStore } from "./auth";
import { apiBaseUrl } from "./config";

/** Mirrors the API limits as an early hint; the API stays authoritative. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const UPLOAD_MESSAGES = {
  tooLarge: "Ảnh lớn hơn 5 MB. Hãy chọn ảnh nhỏ hơn hoặc cắt bớt ảnh.",
  wrongType: "Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP. Hãy chọn ảnh khác.",
  network: "Chưa tải được ảnh lên do mất kết nối. Kiểm tra mạng rồi thử lại.",
  failed: "Chưa tải được ảnh lên. Vui lòng thử lại.",
  picker:
    "Chưa mở được thư viện ảnh. Kiểm tra quyền truy cập ảnh của ứng dụng rồi thử lại."
} as const;

/** The subset of an image picker asset needed to upload it. */
export type PickedImage = {
  uri: string;
  fileName?: string | null | undefined;
  mimeType?: string | undefined;
  fileSize?: number | undefined;
  /** Present on web, where the picker returns a real File. */
  file?: Blob | undefined;
};

/** React Native's multipart file part. */
export type NativeFilePart = { uri: string; name: string; type: string };

const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

function extensionOf(value: string | null | undefined): string | undefined {
  const match = value?.split("?")[0]?.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase();
}

/** Best-known content type of a picked image. */
export function imageContentType(image: PickedImage): string {
  if (image.mimeType) return image.mimeType.toLowerCase();
  const ext = extensionOf(image.fileName) ?? extensionOf(image.uri);
  return (ext && EXTENSION_TYPES[ext]) || "image/jpeg";
}

/** Rejects a picked image the API would refuse, before spending data on it. */
export function precheckImage(image: PickedImage): string | null {
  if (image.fileSize !== undefined && image.fileSize > MAX_IMAGE_BYTES)
    return UPLOAD_MESSAGES.tooLarge;
  const type = imageContentType(image);
  if (!(IMAGE_TYPES as readonly string[]).includes(type))
    return UPLOAD_MESSAGES.wrongType;
  return null;
}

/** The `file` part: the web File itself, or RN's `{ uri, name, type }`. */
export function imageFilePart(image: PickedImage): Blob | NativeFilePart {
  if (image.file) return image.file;
  const type = imageContentType(image);
  const ext =
    Object.keys(EXTENSION_TYPES).find((key) => EXTENSION_TYPES[key] === type) ??
    "jpg";
  // iOS keeps the original name (e.g. IMG_1.HEIC) for an edited JPEG.
  const fileName = image.fileName?.trim();
  const fileExt = extensionOf(fileName);
  const name =
    fileName && fileExt && EXTENSION_TYPES[fileExt] === type
      ? fileName
      : `image.${ext}`;
  return { uri: image.uri, name, type };
}

export function uploadErrorMessage(
  status: number | "network",
  serverMessage?: string
): string {
  if (status === 413) return UPLOAD_MESSAGES.tooLarge;
  if (status === 415) return UPLOAD_MESSAGES.wrongType;
  if (status === "network") return UPLOAD_MESSAGES.network;
  return serverMessage || UPLOAD_MESSAGES.failed;
}

type Fetcher = typeof fetch;

export function createImageUploader(
  baseUrl: string,
  readToken: () => Promise<string | null>,
  fetcher: Fetcher = (...args) => fetch(...args)
) {
  return async function uploadImage(image: PickedImage): Promise<MediaUpload> {
    const form = new FormData();
    // RN's FormData accepts `{ uri, name, type }`; the DOM typing does not.
    form.append("file", imageFilePart(image) as Blob);
    const token = await readToken();
    let response: Response;
    try {
      // No Content-Type: fetch adds the multipart boundary itself.
      response = await fetcher(`${baseUrl}/merchant/media`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: form
      });
    } catch {
      throw new ApiError("network", UPLOAD_MESSAGES.network);
    }
    const payload = (await response.json().catch(() => undefined)) as
      (MediaUpload & { message?: unknown }) | undefined;
    if (!response.ok) {
      const message =
        typeof payload?.message === "string" ? payload.message : undefined;
      throw new ApiError(
        response.status,
        uploadErrorMessage(response.status, message)
      );
    }
    if (!payload?.id) throw new ApiError(response.status, NETWORK_MESSAGE);
    return payload;
  };
}

export const uploadImage = createImageUploader(apiBaseUrl, sessionStore.read);
