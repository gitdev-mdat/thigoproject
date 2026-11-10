import { StyleSheet, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

/** Static placeholder in the shape of a category with product rows. */
export function CatalogSkeleton() {
  return (
    <View
      style={styles.wrap}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {[0, 1].map((section) => (
        <View key={section} style={styles.section}>
          <View style={[styles.bar, styles.heading]} />
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.row}>
              <View style={styles.thumb} />
              <View style={styles.lines}>
                <View style={[styles.bar, styles.long]} />
                <View style={[styles.bar, styles.short]} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md, gap: spacing.lg },
  section: { gap: spacing.sm },
  heading: { width: "40%", height: typography.role.sectionTitle.lineHeight },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.small,
    backgroundColor: colors.border.subtle
  },
  lines: { flex: 1, gap: spacing.xs },
  bar: {
    height: typography.role.bodySecondary.fontSize,
    borderRadius: radius.small,
    backgroundColor: colors.border.subtle
  },
  long: { width: "75%" },
  short: { width: "35%" }
});
