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
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  /** Names the item so screen readers say what changes. */
  itemName: string;
};

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  itemName
}: Props) {
  const step = (delta: number, label: string, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${itemName}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onChange(value + delta)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={[styles.circle, disabled && styles.circleDisabled]}>
        <Icon
          name={delta > 0 ? "plus" : "minus"}
          size={sizes.icon.small}
          color={disabled ? colors.text.disabled : colors.brand.primary}
        />
      </View>
    </Pressable>
  );
  return (
    <View style={styles.row}>
      {step(-1, value - 1 <= 0 && min === 0 ? "Bỏ" : "Giảm", value <= min)}
      <Text
        style={styles.value}
        accessibilityLabel={`Số lượng ${value}`}
        accessibilityLiveRegion="polite"
      >
        {value}
      </Text>
      {step(1, "Thêm", value >= max)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  button: {
    width: sizes.touchTarget.recommended,
    height: sizes.touchTarget.recommended,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center"
  },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  circle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  circleDisabled: { borderColor: colors.border.subtle },
  value: {
    ...typography.role.itemTitle,
    minWidth: spacing.lg,
    textAlign: "center",
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  }
});
