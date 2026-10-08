import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, sizes, spacing, typography } from "@thigo/design-tokens";

export type HomeTab = "home" | "orders" | "account";

const tabs: { id: HomeTab; label: string; icon: string }[] = [
  { id: "home", label: "Trang chủ", icon: "🏠" },
  { id: "orders", label: "Đơn hàng", icon: "🧾" },
  { id: "account", label: "Tài khoản", icon: "👤" }
];

type Props = { active: HomeTab; onChange: (tab: HomeTab) => void };

export function TabBar({ active, onChange }: Props) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
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
            <Text style={[styles.icon, !selected && styles.iconOff]}>
              {tab.icon}
            </Text>
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
    backgroundColor: colors.surface.primary,
    paddingBottom: spacing.xs
  },
  tab: {
    flex: 1,
    minHeight: sizes.touchTarget.recommended + spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs / 2
  },
  indicator: {
    width: spacing.xl,
    height: 3,
    borderRadius: 2,
    marginBottom: spacing.xxs,
    backgroundColor: "transparent"
  },
  indicatorOn: { backgroundColor: colors.brand.primary },
  icon: { fontSize: sizes.icon.large - 2 },
  iconOff: { opacity: 0.55 },
  label: { ...typography.role.caption, color: colors.text.secondary },
  labelOn: { color: colors.text.link }
});
