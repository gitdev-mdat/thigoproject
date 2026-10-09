import { StyleSheet, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

/** Static placeholder in the shape of an order card; no shimmer. */
export function OrderCardSkeleton() {
  return (
    <View style={styles.card} importantForAccessibility="no-hide-descendants">
      <View style={[styles.bar, styles.title]} />
      <View style={[styles.bar, styles.short]} />
      <View style={styles.divider} />
      <View style={[styles.bar, styles.long]} />
      <View style={[styles.bar, styles.medium]} />
      <View style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  bar: {
    height: typography.role.bodySecondary.fontSize,
    borderRadius: radius.small,
    backgroundColor: colors.surface.secondary
  },
  title: { width: "35%", height: typography.role.itemTitle.lineHeight },
  short: { width: "45%" },
  long: { width: "80%" },
  medium: { width: "60%" },
  divider: { height: 1, backgroundColor: colors.border.subtle },
  button: {
    height: spacing.xxl,
    borderRadius: radius.medium,
    backgroundColor: colors.surface.secondary
  }
});
