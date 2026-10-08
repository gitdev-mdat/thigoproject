import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { Icon } from "./Icon";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Extra context read after the label, e.g. "đang ẩn". */
  hint?: string | undefined;
  disabled?: boolean;
};

/** Single-choice chip; selection shows a check and border, not colour alone. */
export function SelectChip({
  label,
  selected,
  onPress,
  hint,
  disabled = false
}: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={hint ? `${label}, ${hint}` : label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && styles.pressed
      ]}
    >
      <View style={styles.content}>
        {selected ? (
          <Icon name="check" size={sizes.icon.small} color={colors.text.link} />
        ) : null}
        <Text
          style={[styles.label, selected && styles.selectedLabel]}
          numberOfLines={2}
        >
          {label}
        </Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: sizes.touchTarget.recommended,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
    maxWidth: "100%"
  },
  selected: {
    borderColor: colors.brand.primary,
    borderWidth: 2,
    paddingHorizontal: spacing.md - 1,
    backgroundColor: colors.brand.primarySubtle
  },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 1
  },
  label: {
    ...typography.role.label,
    color: colors.text.primary,
    flexShrink: 1
  },
  selectedLabel: { color: colors.text.link },
  hint: { ...typography.role.caption, color: colors.text.secondary }
});
