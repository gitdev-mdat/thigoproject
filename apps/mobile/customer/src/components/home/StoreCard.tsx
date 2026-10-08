import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { StoreSummary } from "../../types/catalog";
import { categoryLabel, districtOf } from "../../utils/storeLabels";
import { RemoteImage } from "../RemoteImage";

type Props = {
  store: StoreSummary;
  onPress: () => void;
  /** A dense row for search results. */
  compact?: boolean;
};

export function StoreCard({ store, onPress, compact = false }: Props) {
  const meta = `${categoryLabel[store.category]} · ${store.productCount} món · ${districtOf(store.addressLine)}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${store.name}. ${meta}`}
      accessibilityHint="Mở thực đơn của quán"
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.row : styles.card,
        pressed && styles.pressed
      ]}
    >
      <RemoteImage
        url={store.coverImageUrl}
        style={compact ? styles.thumb : styles.cover}
      />
      <View style={compact ? styles.rowBody : styles.body}>
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
  body: { padding: spacing.sm, paddingHorizontal: spacing.md, gap: 2 },
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
  meta: { ...typography.role.caption, color: colors.text.secondary }
});
