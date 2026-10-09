import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, sizes, spacing, typography } from "@thigo/design-tokens";

type Props = { title: string; actionLabel?: string; onAction?: () => void };

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={spacing.xs}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{actionLabel} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  title: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    flexShrink: 1
  },
  action: {
    minHeight: sizes.touchTarget.recommended,
    justifyContent: "center"
  },
  pressed: { opacity: 0.6 },
  actionText: { ...typography.role.label, color: colors.text.link }
});
