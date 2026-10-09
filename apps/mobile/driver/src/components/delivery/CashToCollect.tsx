import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { formatVnd } from "../../utils/delivery";

type Props = { amount: number; compact?: boolean };

/** Cash on delivery the driver must collect; always the most visible figure. */
export function CashToCollect({ amount, compact = false }: Props) {
  const value = formatVnd(amount);
  return (
    <View
      style={[styles.box, compact && styles.compact]}
      accessible
      accessibilityLabel={`Thu tiền mặt ${value}`}
    >
      <Text style={styles.label}>Thu tiền mặt</Text>
      <Text style={[styles.amount, compact && styles.amountCompact]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.large,
    backgroundColor: colors.brand.primarySubtle
  },
  compact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.medium
  },
  label: { ...typography.role.label, color: colors.text.link },
  amount: {
    ...typography.role.screenTitle,
    color: colors.text.link,
    fontVariant: ["tabular-nums"]
  },
  amountCompact: typography.role.sectionTitle
});
