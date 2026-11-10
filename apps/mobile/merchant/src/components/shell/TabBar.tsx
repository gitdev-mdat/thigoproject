import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { Icon, type IconName } from "../Icon";

export type TabKey = "home" | "orders" | "menu" | "store";

export const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: "home", label: "Tổng quan", icon: "home" },
  { key: "orders", label: "Đơn hàng", icon: "receipt" },
  { key: "menu", label: "Thực đơn", icon: "list" },
  { key: "store", label: "Cửa hàng", icon: "store" }
];

type Props = {
  value: TabKey;
  onChange: (key: TabKey) => void;
  /** Count shown on a tab, e.g. new orders waiting. */
  badges?: Partial<Record<TabKey, number>>;
};

/** Four stable top-level destinations, padded for the home indicator. */
export function TabBar({ value, onChange, badges }: Props) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(bottom, spacing.xs) }]}
      accessibilityRole="tablist"
    >
      {TABS.map((tab) => {
        const selected = tab.key === value;
        const badge = badges?.[tab.key] ?? 0;
        const tint = selected ? colors.brand.primary : colors.text.secondary;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              badge ? `${tab.label}, ${badge} đơn mới` : tab.label
            }
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={[styles.indicator, selected && styles.indicatorOn]} />
            <View style={[styles.iconWrap, selected && styles.iconWrapOn]}>
              <Icon name={tab.icon} size={sizes.icon.large} color={tint} />
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badge > 99 ? "99+" : badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[styles.label, selected && styles.labelOn]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  tab: {
    flex: 1,
    minHeight: sizes.control.prominent + spacing.xs,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing.xxs,
    paddingBottom: spacing.xxs
  },
  pressed: { backgroundColor: colors.surface.secondary },
  indicator: {
    alignSelf: "stretch",
    height: spacing.xxs,
    marginHorizontal: spacing.md,
    borderBottomLeftRadius: radius.small,
    borderBottomRightRadius: radius.small,
    marginBottom: spacing.xxs
  },
  indicatorOn: { backgroundColor: colors.brand.primary },
  iconWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full
  },
  iconWrapOn: { backgroundColor: colors.brand.primarySubtle },
  badge: {
    position: "absolute",
    top: -spacing.xxs,
    right: spacing.xxs,
    minWidth: spacing.md + spacing.xxs,
    paddingHorizontal: spacing.xxs,
    borderRadius: radius.full,
    alignItems: "center",
    backgroundColor: colors.action.destructive
  },
  badgeText: {
    ...typography.role.caption,
    color: colors.text.inverse,
    fontVariant: ["tabular-nums"]
  },
  label: { ...typography.role.caption, color: colors.text.secondary },
  labelOn: {
    color: colors.text.link,
    fontWeight: typography.role.label.fontWeight
  }
});
