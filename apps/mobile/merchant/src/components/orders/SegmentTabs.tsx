import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { SEGMENTS, type SegmentKey } from "../../utils/board";

type Props = {
  value: SegmentKey;
  /** Undefined while the first load is in progress. */
  counts: Record<SegmentKey, number> | undefined;
  onChange: (key: SegmentKey) => void;
};

/**
 * The four work queues. Counts sit above the label so all four fit at 360 dp;
 * waiting new orders get a filled count so they read at a glance.
 */
export function SegmentTabs({ value, counts, onChange }: Props) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {SEGMENTS.map(({ key, label }) => {
        const selected = key === value;
        const count = counts?.[key];
        const alert = key === "new" && (count ?? 0) > 0;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              count === undefined ? label : `${label}, ${count} đơn`
            }
            onPress={() => onChange(key)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.selected,
              pressed && !selected && styles.pressed
            ]}
          >
            <View style={[styles.count, alert && styles.countAlert]}>
              <Text
                style={[
                  styles.countText,
                  selected && styles.selectedText,
                  alert && styles.countAlertText
                ]}
              >
                {count ?? "–"}
              </Text>
            </View>
            <Text
              style={[styles.label, selected && styles.selectedText]}
              numberOfLines={2}
            >
              {label}
            </Text>
            <View style={[styles.indicator, selected && styles.indicatorOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: spacing.xxs,
    padding: spacing.xxs,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  tab: {
    flex: 1,
    minHeight: sizes.control.prominent,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xxs,
    borderRadius: radius.small
  },
  selected: { backgroundColor: colors.brand.primarySubtle },
  pressed: { backgroundColor: colors.surface.secondary },
  count: {
    minWidth: sizes.icon.large,
    paddingHorizontal: spacing.xxs,
    borderRadius: radius.full,
    alignItems: "center"
  },
  countAlert: { backgroundColor: colors.action.destructive },
  countText: {
    ...typography.role.itemTitle,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  },
  countAlertText: { color: colors.text.inverse },
  label: {
    ...typography.role.label,
    color: colors.text.secondary,
    textAlign: "center"
  },
  selectedText: { color: colors.text.link },
  indicator: {
    alignSelf: "stretch",
    height: spacing.xxs,
    marginHorizontal: spacing.xs,
    borderTopLeftRadius: radius.small,
    borderTopRightRadius: radius.small
  },
  indicatorOn: { backgroundColor: colors.brand.primary }
});
