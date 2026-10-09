import { Pressable, StyleSheet } from "react-native";
import { colors, radius, sizes } from "@thigo/design-tokens";

import { Icon, type IconName } from "./Icon";

type Props = {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

/** Icon-only action with a 48 dp target; `label` is its accessible name. */
export function IconButton({ icon, label, onPress, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      <Icon
        name={icon}
        color={disabled ? colors.text.disabled : colors.text.primary}
      />
    </Pressable>
  );
}

const SIZE = sizes.touchTarget.recommended;

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center"
  },
  pressed: { backgroundColor: colors.action.secondaryPressed }
});
