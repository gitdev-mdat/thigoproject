import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { Delivery } from "../../types/delivery";
import { formatClock, formatVnd } from "../../utils/delivery";

type Props = { deliveries: Delivery[] };

/** Compact record of the driver's latest completed deliveries. */
export function HistoryList({ deliveries }: Props) {
  if (!deliveries.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        Đã giao gần đây
      </Text>
      <View style={styles.list}>
        {deliveries.map((delivery, index) => {
          const at = delivery.timeline.deliveredAt;
          return (
            <View
              key={delivery.id}
              style={[styles.row, index > 0 && styles.divider]}
              accessible
            >
              <View style={styles.text}>
                <Text style={styles.store} numberOfLines={1}>
                  {delivery.storeName}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {delivery.code}
                  {at ? ` · Giao lúc ${formatClock(at)}` : ""}
                </Text>
              </View>
              <Text style={styles.amount}>{formatVnd(delivery.totalVnd)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  title: { ...typography.role.label, color: colors.text.secondary },
  list: {
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border.subtle },
  text: { flex: 1, gap: spacing.xxs },
  store: { ...typography.role.label, color: colors.text.primary },
  meta: {
    ...typography.role.caption,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  },
  amount: {
    ...typography.role.label,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  }
});
