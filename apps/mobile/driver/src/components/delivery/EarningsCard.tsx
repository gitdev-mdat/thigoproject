import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { DriverEarnings } from "../../types/dispatch";
import { formatVnd } from "../../utils/delivery";

type Props = { earnings: DriverEarnings };

export function EarningsCard({ earnings }: Props) {
  return (
    <View style={styles.card} accessible>
      <Text style={styles.title} accessibilityRole="header">
        Thu nhập giao hàng
      </Text>
      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.label}>Hôm nay</Text>
          <Text style={styles.amount}>{formatVnd(earnings.todayVnd)}</Text>
          <Text style={styles.caption}>{earnings.completedToday} đơn</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.label}>Tuần này</Text>
          <Text style={styles.amount}>{formatVnd(earnings.weekVnd)}</Text>
          <Text style={styles.caption}>{earnings.completedWeek} đơn</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  title: { ...typography.role.itemTitle, color: colors.text.primary },
  row: { flexDirection: "row", gap: spacing.sm },
  metric: { flex: 1, gap: spacing.xxs },
  label: { ...typography.role.caption, color: colors.text.secondary },
  amount: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  caption: {
    ...typography.role.caption,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  }
});
