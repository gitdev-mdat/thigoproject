import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { OrderSummary } from "../../types/orders";
import { formatOrderDate, formatVnd } from "../../utils/format";
import { describeStatus, isActive } from "../../utils/orderStatus";
import { Chip } from "../Chip";
import { RemoteImage } from "../RemoteImage";

type Props = { order: OrderSummary; onPress: () => void };

const tone = {
  progress: "info",
  success: "success",
  danger: "danger"
} as const;

export function OrderCard({ order, onPress }: Props) {
  const status = describeStatus(order);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Đơn ${order.storeName}, ${status.label}, ${formatVnd(order.totalVnd)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isActive(order.status) && styles.active,
        pressed && styles.pressed
      ]}
    >
      <RemoteImage url={order.storeImageUrl} style={styles.thumb} />
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.store} numberOfLines={1}>
            {order.storeName}
          </Text>
          <Text style={styles.total}>{formatVnd(order.totalVnd)}</Text>
        </View>
        <Text style={styles.items} numberOfLines={1}>
          {order.itemsPreview}
        </Text>
        <View style={styles.bottom}>
          <Chip label={status.label} tone={tone[status.tone]} />
          <Text style={styles.date}>{formatOrderDate(order.placedAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  active: { borderColor: colors.brand.primary, borderWidth: 2 },
  pressed: { backgroundColor: colors.surface.secondary },
  thumb: { width: 64, height: 64, borderRadius: radius.medium },
  body: { flex: 1, gap: spacing.xxs },
  top: { flexDirection: "row", gap: spacing.xs },
  store: { ...typography.role.itemTitle, flex: 1, color: colors.text.primary },
  total: {
    ...typography.role.label,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  items: { ...typography.role.bodySecondary, color: colors.text.secondary },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  date: { ...typography.role.caption, color: colors.text.secondary }
});
