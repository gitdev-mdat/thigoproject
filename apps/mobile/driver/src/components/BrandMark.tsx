import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

type Props = {
  /** Role name shown beside the wordmark, e.g. "Khách hàng". */
  role: string;
  tone?: "light" | "dark";
};

export function BrandMark({ role, tone = "light" }: Props) {
  const onDark = tone === "dark";
  return (
    <View style={styles.row} accessible accessibilityLabel={`THIGO ${role}`}>
      <View style={[styles.mark, onDark && styles.markOnDark]}>
        <Text style={[styles.markText, onDark && styles.markTextOnDark]}>
          T
        </Text>
      </View>
      <Text style={[styles.wordmark, onDark && styles.inverse]}>THIGO</Text>
      <View style={[styles.role, onDark && styles.roleOnDark]}>
        <Text style={[styles.roleText, onDark && styles.inverse]}>{role}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  mark: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radius.small,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  markOnDark: { backgroundColor: colors.surface.primary },
  markText: { ...typography.role.sectionTitle, color: colors.text.inverse },
  markTextOnDark: { color: colors.brand.primary },
  wordmark: { ...typography.role.itemTitle, color: colors.text.primary },
  inverse: { color: colors.text.inverse },
  role: {
    marginLeft: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default
  },
  roleOnDark: { borderColor: colors.text.inverse },
  roleText: { ...typography.role.caption, color: colors.text.primary }
});
