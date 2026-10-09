import { useState } from "react";

import { useImageUpload } from "../../hooks/useImageUpload";
import type { Storefront } from "../../hooks/useStorefront";
import { updateStore } from "../../services/storefront";
import type { MerchantStoreProfile } from "../../types/storefront";
import { ImagePickerCard } from "../media/ImagePickerCard";

const KINDS = {
  cover: {
    label: "Ảnh bìa",
    noun: "ảnh bìa",
    aspect: [16, 9] as [number, number],
    field: "coverMediaId",
    url: (store: MerchantStoreProfile) => store.coverImageUrl
  },
  logo: {
    label: "Logo",
    noun: "logo",
    aspect: [1, 1] as [number, number],
    field: "logoMediaId",
    url: (store: MerchantStoreProfile) => store.logoImageUrl
  }
} as const;

type Props = {
  kind: keyof typeof KINDS;
  store: MerchantStoreProfile;
  storefront: Storefront;
  onSaved: (message: string) => void;
};

/** Upload, attach, replace or remove the store's logo or cover. */
export function StoreImageField({ kind, store, storefront, onSaved }: Props) {
  const config = KINDS[kind];
  const upload = useImageUpload(config.aspect);
  const [saving, setSaving] = useState(false);
  const [pendingUri, setPendingUri] = useState<string>();
  const [error, setError] = useState("");

  const attach = async (mediaId: string | null) => {
    setSaving(true);
    setError("");
    const result = await storefront.mutateStore(() =>
      updateStore({ [config.field]: mediaId })
    );
    setSaving(false);
    setPendingUri(undefined);
    if (!result.ok) {
      // The image was not attached, so stop previewing it.
      upload.clear();
      return setError(result.message);
    }
    onSaved(mediaId ? `Đã cập nhật ${config.noun}.` : `Đã gỡ ${config.noun}.`);
  };

  const pick = async () => {
    setError("");
    const picked = await upload.pickAndUpload();
    if (!picked) return;
    setPendingUri(picked.localUri);
    await attach(picked.media.id);
  };

  return (
    <ImagePickerCard
      label={config.label}
      noun={config.noun}
      imageUrl={pendingUri ?? upload.previewUri ?? config.url(store)}
      aspectRatio={config.aspect[0] / config.aspect[1]}
      status={upload.status}
      error={upload.error || error}
      saving={saving}
      onPick={() => void pick()}
      onRemove={() => {
        upload.clear();
        void attach(null);
      }}
    />
  );
}
