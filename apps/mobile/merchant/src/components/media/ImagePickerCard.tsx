import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import type { UploadStatus } from "../../hooks/useImageUpload";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { Notice } from "../Notice";
import { RemoteImage } from "../RemoteImage";

type Props = {
  /** Field label, e.g. "Ảnh món". */
  label: string;
  /** Current image (API URL or local preview), or null. */
  imageUrl: string | null | undefined;
  /** Width / height of the preview frame. */
  aspectRatio: number;
  status: UploadStatus;
  error?: string | undefined;
  /** True while the chosen image is being attached to the record. */
  saving?: boolean;
  disabled?: boolean;
  onPick: () => void;
  onRemove: () => void;
  /** Shown inside an empty frame instead of the default icon. */
  placeholder?: ReactNode;
  /** Names what the image is for in buttons, e.g. "ảnh bìa". */
  noun?: string;
};

/** Preview with pick, replace and remove, plus upload progress and errors. */
export function ImagePickerCard({
  label,
  imageUrl,
  aspectRatio,
  status,
  error,
  saving = false,
  disabled = false,
  onPick,
  onRemove,
  placeholder,
  noun = "ảnh"
}: Props) {
  const uploading = status === "uploading";
  const working = uploading || saving || status === "picking";
  const hasImage = Boolean(imageUrl);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.frame, { aspectRatio }]}>
        <RemoteImage
          url={imageUrl}
          style={StyleSheet.absoluteFill}
          fallback={
            placeholder ?? (
              <View style={styles.empty}>
                <Icon
                  name="image"
                  size={sizes.icon.large}
                  color={colors.text.secondary}
                />
                <Text style={styles.emptyText}>Chưa có {noun}</Text>
              </View>
            )
          }
        />
        {uploading || saving ? (
          <View style={styles.progress} accessibilityLiveRegion="polite">
            <ActivityIndicator size="small" color={colors.text.inverse} />
            <Text style={styles.progressText}>
              {uploading ? "Đang tải ảnh lên…" : "Đang lưu ảnh…"}
            </Text>
          </View>
        ) : null}
      </View>
      {error ? <Notice message={error} tone="danger" /> : null}
      <View style={styles.actions}>
        <Button
          label={hasImage ? `Đổi ${noun}` : `Chọn ${noun}`}
          loadingLabel={uploading ? "Đang tải lên…" : "Đang mở thư viện…"}
          variant="secondary"
          loading={status === "picking" || uploading}
          disabled={disabled || saving}
          onPress={onPick}
          style={styles.action}
        />
        {hasImage ? (
          <Button
            label={`Gỡ ${noun}`}
            variant="danger"
            disabled={disabled || working}
            onPress={onRemove}
            style={styles.action}
          />
        ) : null}
      </View>
      <Text style={styles.help}>JPEG, PNG hoặc WebP, tối đa 5 MB.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.role.label, color: colors.text.primary },
  frame: {
    width: "100%",
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: "hidden",
    backgroundColor: colors.surface.secondary
  },
  empty: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs
  },
  emptyText: { ...typography.role.bodySecondary, color: colors.text.secondary },
  progress: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface.inverse
  },
  progressText: { ...typography.role.label, color: colors.text.inverse },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  action: { flexGrow: 1, flexBasis: 140 },
  help: { ...typography.role.caption, color: colors.text.secondary }
});
