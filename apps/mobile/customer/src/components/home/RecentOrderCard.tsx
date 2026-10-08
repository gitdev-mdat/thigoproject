import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { RecentOrder } from "../../types/home";
import { formatOrderDate, formatVnd } from "../../utils/format";
import { Chip } from "../Chip";
import { ArtTile } from "./ArtTile";

type Props = { order: RecentOrder; onPress?: () => void };

const statusLabel: Record<RecentOrder["status"], string> = {
  delivered: "Đã giao",
  cancelled: "Đã huỷ"
};

export function RecentOrderCard({ order, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ArtTile art={order.art} size={52} />
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={styles.store} numberOfLines={1}>
            {order.storeName}
          </Text>
          <Chip
            label={statusLabel[order.status]}
            tone={order.status === "delivered" ? "brand" : "neutral"}
          />
        </View>
        <Text style={styles.items} numberOfLines={1}>
          {order.itemsSummary}
        </Text>
        <Text style={styles.meta}>
          {formatOrderDate(order.placedAt)} · {formatVnd(order.total)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  text: { flex: 1, gap: spacing.xxs },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs
  },
  store: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    flexShrink: 1
  },
  items: { ...typography.role.bodySecondary, color: colors.text.secondary },
  meta: {
    ...typography.role.caption,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  }
});
