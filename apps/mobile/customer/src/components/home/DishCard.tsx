import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { DishSummary } from "../../types/catalog";
import { formatVnd } from "../../utils/format";
import { RemoteImage } from "../RemoteImage";

type Props = {
  dish: DishSummary;
  onPress: () => void;
  /** "card" for horizontal rails, "row" for search results. */
  layout?: "card" | "row";
};

export function DishCard({ dish, onPress, layout = "card" }: Props) {
  const row = layout === "row";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}, ${formatVnd(dish.priceVnd)}, ${dish.storeName}`}
      accessibilityHint="Xem món và tuỳ chọn"
      onPress={onPress}
      style={({ pressed }) => [
        row ? styles.row : styles.card,
        pressed && styles.pressed
      ]}
    >
      <RemoteImage
        url={dish.imageUrl}
        style={row ? styles.thumb : styles.image}
      />
      <View style={row ? styles.rowBody : styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {dish.name}
        </Text>
        <Text style={styles.store} numberOfLines={1}>
          {dish.storeName}
        </Text>
        <Text style={styles.price}>{formatVnd(dish.priceVnd)}</Text>
      </View>
    </Pressable>
  );
}

const CARD_WIDTH = 156;

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, borderRadius: radius.large },
  pressed: { opacity: 0.85 },
  image: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.8,
    borderRadius: radius.large
  },
  body: { paddingTop: spacing.xs, gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  thumb: { width: 64, height: 64, borderRadius: radius.medium },
  rowBody: { flex: 1, gap: 2 },
  name: { ...typography.role.label, color: colors.text.primary },
  store: { ...typography.role.caption, color: colors.text.secondary },
  price: {
    ...typography.role.label,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  }
});
