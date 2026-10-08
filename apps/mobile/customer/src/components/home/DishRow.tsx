import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@thigo/design-tokens";

import type { DishSummary } from "../../types/home";
import { formatVnd } from "../../utils/format";
import { ArtTile } from "./ArtTile";

type Props = { dish: DishSummary; divider?: boolean };

export function DishRow({ dish, divider = false }: Props) {
  return (
    <View
      accessible
      accessibilityLabel={`${dish.name}, ${dish.storeName}, ${formatVnd(dish.price)}`}
      style={[styles.row, divider && styles.divider]}
    >
      <ArtTile art={dish.art} size={56} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={2}>
          {dish.name}
        </Text>
        <Text style={styles.store} numberOfLines={1}>
          {dish.storeName}
        </Text>
      </View>
      <Text style={styles.price}>{formatVnd(dish.price)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border.subtle },
  text: { flex: 1, gap: spacing.xxs },
  name: { ...typography.role.itemTitle, color: colors.text.primary },
  store: { ...typography.role.bodySecondary, color: colors.text.secondary },
  price: {
    ...typography.role.label,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  }
});
