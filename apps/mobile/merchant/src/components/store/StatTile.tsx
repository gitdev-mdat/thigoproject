import { Pressable, StyleSheet, Text } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

type Props = {
  label: string;
  /** Undefined while loading; shown as a dash. */
  value: number | undefined;
  onPress?: () => void;
  /** Draws attention when the number needs action. */
  emphasis?: boolean;
};

/** One real count from the API; tappable when it leads somewhere. */
export function StatTile({ label, value, onPress, emphasis = false }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${label}: ${value ?? "đang tải"}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        emphasis && styles.emphasis,
        pressed && styles.pressed
      ]}
    >
      <Text style={[styles.value, emphasis && styles.emphasisText]}>
        {value ?? "–"}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: sizes.touchTarget.recommended,
    padding: spacing.md,
    gap: spacing.xxs,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  emphasis: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySubtle
  },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  value: {
    ...typography.role.screenTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  emphasisText: { color: colors.text.link },
  label: { ...typography.role.bodySecondary, color: colors.text.secondary }
});
