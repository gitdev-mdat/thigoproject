import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, sizes, spacing, typography } from "@thigo/design-tokens";

import { Icon, type IconName } from "../Icon";

export type HomeTab = "home" | "orders" | "account";

const tabs: { id: HomeTab; label: string; icon: IconName }[] = [
  { id: "home", label: "Trang chủ", icon: "home" },
  { id: "orders", label: "Đơn hàng", icon: "receipt" },
  { id: "account", label: "Tài khoản", icon: "user" }
];

type Props = { active: HomeTab; onChange: (tab: HomeTab) => void };

export function TabBar({ active, onChange }: Props) {
  // Reserve the Android navigation bar / iOS home indicator below the tabs.
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(bottom, spacing.xs) }]}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            onPress={() => onChange(tab.id)}
            style={styles.tab}
          >
            <View style={[styles.indicator, selected && styles.indicatorOn]} />
            <Icon
              name={tab.icon}
              color={selected ? colors.brand.primary : colors.text.secondary}
            />
            <Text style={[styles.label, selected && styles.labelOn]}>
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
    minHeight: sizes.touchTarget.recommended + spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs
  },
  indicator: {
    width: spacing.xl,
    height: 3,
    borderRadius: 2,
    marginBottom: spacing.xxs,
    backgroundColor: "transparent"
  },
  indicatorOn: { backgroundColor: colors.brand.primary },
  label: { ...typography.role.caption, color: colors.text.secondary },
  labelOn: { color: colors.text.link }
});
