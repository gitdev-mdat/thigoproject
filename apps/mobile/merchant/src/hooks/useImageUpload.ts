import { useCallback, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { ApiError } from "../services/api";
import { UPLOAD_MESSAGES, precheckImage, uploadImage } from "../services/media";
import type { MediaUpload } from "../types/storefront";

export type UploadStatus = "idle" | "picking" | "uploading" | "error";

export type PickedUpload = {
  media: MediaUpload;
  /** Local file URI, e.g. to keep previewing while the media is attached. */
  localUri: string;
};

/**
 * Picks one image from the library and uploads it. The caller attaches the
 * returned media id with its own PATCH, so an upload never changes data alone.
 * `previewUri` is the local file only while it uploads.
 */
export function useImageUpload(aspect: [number, number] = [4, 3]) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");
  const [previewUri, setPreviewUri] = useState<string>();
  const busy = useRef(false);

  const pickAndUpload = useCallback(async (): Promise<PickedUpload | null> => {
    if (busy.current) return null;
    busy.current = true;
    setError("");
    setStatus("picking");
    try {
      let result: ImagePicker.ImagePickerResult;
      try {
        // Editing re-encodes the crop, so iOS HEIC photos arrive as JPEG.
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect,
          quality: 0.8
        });
      } catch {
        setError(UPLOAD_MESSAGES.picker);
        setStatus("error");
        return null;
      }
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) {
        setStatus("idle");
        return null;
      }
      const problem = precheckImage(asset);
      if (problem) {
        setError(problem);
        setStatus("error");
        return null;
      }
      setPreviewUri(asset.uri);
      setStatus("uploading");
      const media = await uploadImage(asset);
      // The local preview covers only the upload; callers show media.url next.
      setPreviewUri(undefined);
      setStatus("idle");
      return { media, localUri: asset.uri };
    } catch (e) {
      setPreviewUri(undefined);
      setError(e instanceof ApiError ? e.message : UPLOAD_MESSAGES.failed);
      setStatus("error");
      return null;
    } finally {
      busy.current = false;
    }
  }, [aspect]);

  const clear = useCallback(() => {
    setError("");
    setPreviewUri(undefined);
    setStatus("idle");
  }, []);

  return { status, error, previewUri, pickAndUpload, clear };
}

export type ImageUpload = ReturnType<typeof useImageUpload>;
