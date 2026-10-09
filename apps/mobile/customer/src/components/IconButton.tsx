import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, sizes, typography } from "@thigo/design-tokens";

import { raisedShadow } from "../utils/layout";
import { Icon, type IconName } from "./Icon";

type Props = {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** "floating" sits on imagery; "plain" sits on a surface. */
  tone?: "floating" | "plain";
  badge?: number;
  disabled?: boolean;
};

export function IconButton({
  icon,
  label,
  onPress,
  tone = "plain",
  badge,
  disabled = false
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} món` : label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        tone === "floating" && [styles.floating, raisedShadow],
        pressed && styles.pressed
      ]}
    >
      <Icon
        name={icon}
        color={disabled ? colors.text.disabled : colors.text.primary}
      />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
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
  floating: { backgroundColor: colors.surface.elevated },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  badge: {
    position: "absolute",
    top: 2,
    right: 0,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primary,
    borderWidth: 2,
    borderColor: colors.surface.primary
  },
  badgeText: {
    ...typography.role.caption,
    lineHeight: 14,
    fontSize: 11,
    color: colors.text.inverse,
    fontVariant: ["tabular-nums"]
  }
});
