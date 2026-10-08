import { useCallback, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { ApiError } from "../services/api";
import { UPLOAD_MESSAGES, precheckImage, uploadImage } from "../services/media";
import type { MediaUpload } from "../types/storefront";

export type UploadStatus = "idle" | "picking" | "uploading" | "error";

export type PickedUpload = {
  media: MediaUpload;
  /** Local file URI for an instant preview while the remote image loads. */
  localUri: string;
};

/**
 * Picks one image from the library and uploads it. The caller attaches the
 * returned media id with its own PATCH, so an upload never changes data alone.
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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect,
        quality: 0.8
      });
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
