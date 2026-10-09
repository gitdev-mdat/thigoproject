import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { StoreSummary } from "../../types/catalog";
import {
  categoryLabel,
  closedLabel,
  districtOf
} from "../../utils/storeLabels";
import { RemoteImage } from "../RemoteImage";

type Props = {
  store: StoreSummary;
  onPress: () => void;
  /** A dense row for search results. */
  compact?: boolean;
};

export function StoreCard({ store, onPress, compact = false }: Props) {
  const meta = `${categoryLabel[store.category]} · ${store.productCount} món · ${districtOf(store.addressLine)}`;
  const closed = store.closedReason ? closedLabel[store.closedReason] : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${store.name}. ${closed ? `${closed}. ` : ""}${meta}`}
      accessibilityHint="Mở thực đơn của quán"
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.row : styles.card,
        pressed && styles.pressed
      ]}
    >
      <View>
        <RemoteImage
          url={
            compact
              ? (store.logoImageUrl ?? store.coverImageUrl)
              : store.coverImageUrl
          }
          style={compact ? styles.thumb : styles.cover}
        />
        {!compact && store.logoImageUrl ? (
          <RemoteImage url={store.logoImageUrl} style={styles.logo} />
        ) : null}
      </View>
      <View
        style={
          compact
            ? styles.rowBody
            : [styles.body, store.logoImageUrl ? styles.bodyWithLogo : null]
        }
      >
        <Text style={styles.name} numberOfLines={1}>
          {store.name}
        </Text>
        {!compact && store.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {store.description}
          </Text>
        ) : null}
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
        {closed ? (
          <Text style={styles.closed} numberOfLines={1}>
            {closed}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
    overflow: "hidden"
  },
  pressed: { backgroundColor: colors.surface.secondary },
  cover: { aspectRatio: 2.4, width: "100%" },
  logo: {
    position: "absolute",
    left: spacing.md,
    bottom: -spacing.md,
    width: 44,
    height: 44,
    borderRadius: radius.medium,
    borderWidth: 2,
    borderColor: colors.surface.primary
  },
  body: { padding: spacing.sm, paddingHorizontal: spacing.md, gap: 2 },
  bodyWithLogo: { paddingTop: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.medium
  },
  thumb: { width: 64, height: 64, borderRadius: radius.medium },
  rowBody: { flex: 1, gap: 2 },
  name: { ...typography.role.itemTitle, color: colors.text.primary },
  description: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary
  },
  meta: { ...typography.role.caption, color: colors.text.secondary },
  closed: { ...typography.role.label, color: colors.status.warning }
});
