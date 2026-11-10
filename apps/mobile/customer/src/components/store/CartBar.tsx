import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { formatVnd } from "../../utils/format";
import { overlayShadow } from "../../utils/layout";
import { Icon } from "../Icon";

type Props = { count: number; subtotal: number; onPress: () => void };

/** Floating summary that keeps the cart one tap away while browsing a menu. */
export function CartBar({ count, subtotal, onPress }: Props) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(bottom, spacing.sm) }]}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem giỏ hàng, ${count} món, tạm tính ${formatVnd(subtotal)}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.bar,
          overlayShadow,
          pressed && styles.pressed
        ]}
      >
        <View style={styles.count}>
          <Icon
            name="bag"
            size={sizes.icon.standard}
            color={colors.text.inverse}
          />
          <Text style={styles.countText}>{count}</Text>
        </View>
        <Text style={styles.label}>Xem giỏ hàng</Text>
        <Text style={styles.total}>{formatVnd(subtotal)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  bar: {
    minHeight: sizes.control.prominent,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.large,
    backgroundColor: colors.brand.primary
  },
  pressed: { backgroundColor: colors.brand.primaryPressed },
  count: { flexDirection: "row", alignItems: "center", gap: spacing.xxs },
  countText: {
    ...typography.role.label,
    color: colors.text.inverse,
    fontVariant: ["tabular-nums"]
  },
  label: { ...typography.role.label, flex: 1, color: colors.text.inverse },
  total: {
    ...typography.role.itemTitle,
    color: colors.text.inverse,
    fontVariant: ["tabular-nums"]
  }
});
