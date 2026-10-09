import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Notice } from "../../components/Notice";
import { useImageUpload } from "../../hooks/useImageUpload";
import { attempt } from "../../services/api";
import {
  deleteApplicationImage,
  privateImageSource,
  uploadApplicationImage,
  type ApplicationImageKind
} from "../../services/application";
import type { ApplicationImage } from "../../types/application";

const MAX_PHOTOS = 4;

type Props = {
  images: ApplicationImage[];
  editable: boolean;
  /** Reloads the application after an upload or removal. */
  onChanged: () => void;
};

/**
 * Optional review images: a logo, a cover and a few photos of the shop or
 * dishes. They stay private to the applicant and THIGO and never become
 * storefront images by themselves.
 */
export function ApplicationPhotos({ images, editable, onChanged }: Props) {
  const logo = images.find((image) => image.kind === "LOGO");
  const cover = images.find((image) => image.kind === "COVER");
  const photos = images.filter((image) => image.kind === "PHOTO");
  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        Ảnh cửa hàng (không bắt buộc)
      </Text>
      <Text style={styles.help}>
        Giúp THIGO duyệt nhanh hơn. Chỉ bạn và THIGO xem được; ảnh không tự đưa
        lên cửa hàng.
      </Text>
      <View style={styles.row}>
        <Slot
          kind="LOGO"
          label="Logo"
          image={logo}
          editable={editable}
          square
          onChanged={onChanged}
        />
        <Slot
          kind="COVER"
          label="Ảnh bìa"
          image={cover}
          editable={editable}
          onChanged={onChanged}
        />
      </View>
      <Text style={styles.subtitle}>
        Ảnh quán hoặc món · {photos.length}/{MAX_PHOTOS}
      </Text>
      <View style={styles.grid}>
        {photos.map((photo) => (
          <Slot
            key={photo.id}
            kind="PHOTO"
            label="Ảnh"
            image={photo}
            editable={editable}
            onChanged={onChanged}
          />
        ))}
        {editable && photos.length < MAX_PHOTOS ? (
          <Slot kind="PHOTO" label="Thêm ảnh" editable onChanged={onChanged} />
        ) : null}
      </View>
    </View>
  );
}

function Slot({
  kind,
  label,
  image,
  editable,
  square = false,
  onChanged
}: {
  kind: ApplicationImageKind;
  label: string;
  image?: ApplicationImage | undefined;
  editable: boolean;
  square?: boolean;
  onChanged: () => void;
}) {
  const uploader = useMemo(() => uploadApplicationImage(kind), [kind]);
  const upload = useImageUpload(square ? [1, 1] : [4, 3], uploader);
  const [source, setSource] = useState<{ uri: string }>();
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (image)
      void privateImageSource(image.url).then(
        (next) => active && setSource(next)
      );
    else setSource(undefined);
    return () => {
      active = false;
    };
  }, [image]);

  const busy = upload.status === "uploading" || removing;
  const pick = async () => {
    setError("");
    if (await upload.pickAndUpload()) onChanged();
  };
  const remove = async () => {
    if (!image) return;
    setRemoving(true);
    setError("");
    const result = await attempt(() => deleteApplicationImage(image.id));
    setRemoving(false);
    if (!result.ok) return setError(result.message);
    onChanged();
  };

  return (
    <View style={[styles.slot, square ? styles.square : styles.wide]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={image ? `${label}, đổi ảnh` : `${label}, chọn ảnh`}
        disabled={!editable || busy}
        onPress={() => void pick()}
        style={({ pressed }) => [
          styles.frame,
          square ? styles.frameSquare : styles.frameWide,
          pressed && styles.pressed
        ]}
      >
        {upload.previewUri ? (
          <Image source={{ uri: upload.previewUri }} style={styles.image} />
        ) : source ? (
          <Image source={source} style={styles.image} />
        ) : (
          <View style={styles.empty}>
            <Icon
              name={image ? "image" : "plus"}
              color={colors.brand.primary}
            />
            <Text style={styles.emptyText}>{label}</Text>
          </View>
        )}
        {busy ? (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.text.inverse} />
          </View>
        ) : null}
      </Pressable>
      {image && editable ? (
        <Button
          label="Xóa ảnh"
          variant="tertiary"
          disabled={busy}
          onPress={() => void remove()}
        />
      ) : null}
      {upload.error || error ? (
        <Notice message={upload.error || error} tone="danger" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  title: { ...typography.role.itemTitle, color: colors.text.primary },
  subtitle: { ...typography.role.label, color: colors.text.primary },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: { gap: spacing.xxs },
  square: { width: 112 },
  wide: { flex: 1, minWidth: 150 },
  frame: {
    overflow: "hidden",
    borderRadius: radius.medium,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.default,
    backgroundColor: colors.surface.secondary
  },
  frameSquare: { width: 112, height: 112 },
  frameWide: { height: 112 },
  pressed: { opacity: 0.8 },
  image: { width: "100%", height: "100%" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs
  },
  emptyText: { ...typography.role.caption, color: colors.brand.primary },
  overlay: {
    position: "absolute",
    left: spacing.xs,
    bottom: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface.inverse
  }
});
