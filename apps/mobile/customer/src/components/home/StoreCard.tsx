import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { StoreSummary } from "../../types/home";
import { formatCount, formatRating } from "../../utils/format";
import { raisedShadow } from "../../utils/layout";
import { Chip } from "../Chip";
import { ArtTile } from "./ArtTile";

type Props = {
  store: StoreSummary;
  width?: number;
  /** A row layout for vertical lists such as search results. */
  compact?: boolean;
};

export function StoreCard({ store, width, compact = false }: Props) {
  const meta = (
    <Text style={styles.meta} numberOfLines={1}>
      <Text style={styles.star}>★ </Text>
      <Text style={styles.rating}>{formatRating(store.rating)}</Text> (
      {formatCount(store.ratingCount)}) · {store.etaMinutes.min}–
      {store.etaMinutes.max} phút
    </Text>
  );
  const label = `${store.name}, ${formatRating(store.rating)} sao, ${store.etaMinutes.min} đến ${store.etaMinutes.max} phút`;
  if (compact)
    return (
      <View accessible accessibilityLabel={label} style={styles.row}>
        <ArtTile art={store.art} size={56} />
        <View style={styles.rowText}>
          <Text style={styles.name} numberOfLines={1}>
            {store.name}
          </Text>
          {meta}
          <Text style={styles.rowTags} numberOfLines={1}>
            {store.tags.join(" · ")}
          </Text>
        </View>
      </View>
    );
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.card, raisedShadow, width ? { width } : null]}
    >
      <View style={styles.banner}>
        <ArtTile art={store.art} size={72} rounded="full" tone="neutral" />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {store.name}
        </Text>
        {meta}
        <View style={styles.tags}>
          {store.tags.slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} tone="brand" />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.elevated,
    overflow: "hidden"
  },
  banner: {
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primarySubtle
  },
  body: { padding: spacing.sm, gap: spacing.xxs },
  name: { ...typography.role.itemTitle, color: colors.text.primary },
  meta: { ...typography.role.bodySecondary, color: colors.text.secondary },
  star: { color: colors.text.primary },
  rating: { ...typography.role.label, color: colors.text.primary },
  tags: { flexDirection: "row", gap: spacing.xxs, marginTop: spacing.xxs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  rowText: { flex: 1, gap: spacing.xxs / 2 },
  rowTags: { ...typography.role.caption, color: colors.text.secondary }
});
