import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import type { ProductOptionGroup } from "../../types/catalog";
import { formatVnd } from "../../utils/format";
import { Icon } from "../Icon";

type Props = {
  group: ProductOptionGroup;
  selected: string[];
  onToggle: (optionId: string) => void;
};

function rule(group: ProductOptionGroup): string {
  if (group.maxSelect === 1)
    return group.minSelect ? "Bắt buộc · Chọn 1" : "Không bắt buộc · Chọn 1";
  return group.minSelect
    ? `Bắt buộc · Chọn ${group.minSelect}–${group.maxSelect}`
    : `Không bắt buộc · Tối đa ${group.maxSelect}`;
}

export function OptionGroupField({ group, selected, onToggle }: Props) {
  const single = group.maxSelect === 1;
  const full = !single && selected.length >= group.maxSelect;
  return (
    <View
      style={styles.group}
      accessibilityRole={single ? "radiogroup" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {group.name}
        </Text>
        <Text style={[styles.rule, group.minSelect > 0 && styles.required]}>
          {rule(group)}
        </Text>
      </View>
      {group.options.map((option) => {
        const checked = selected.includes(option.id);
        const disabled = !option.isAvailable || (full && !checked);
        return (
          <Pressable
            key={option.id}
            accessibilityRole={single ? "radio" : "checkbox"}
            accessibilityState={{ checked, disabled }}
            accessibilityLabel={`${option.name}${option.priceDeltaVnd ? `, thêm ${formatVnd(option.priceDeltaVnd)}` : ""}${option.isAvailable ? "" : ", tạm hết"}`}
            disabled={disabled}
            onPress={() => onToggle(option.id)}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <View
              style={[
                single ? styles.radio : styles.checkbox,
                checked && styles.markOn,
                disabled && !checked && styles.markDisabled
              ]}
            >
              {checked ? (
                single ? (
                  <View style={styles.dot} />
                ) : (
                  <Icon
                    name="check"
                    size={sizes.icon.small}
                    color={colors.text.inverse}
                  />
                )
              ) : null}
            </View>
            <Text style={[styles.name, disabled && !checked && styles.muted]}>
              {option.name}
              {option.isAvailable ? "" : " (tạm hết)"}
            </Text>
            {option.priceDeltaVnd ? (
              <Text
                style={[styles.price, disabled && !checked && styles.muted]}
              >
                +{formatVnd(option.priceDeltaVnd)}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const MARK = 22;

const styles = StyleSheet.create({
  group: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: 8,
    borderTopColor: colors.surface.secondary
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xxs
  },
  title: { ...typography.role.itemTitle, color: colors.text.primary },
  rule: { ...typography.role.caption, color: colors.text.secondary },
  required: { color: colors.status.warning },
  option: {
    minHeight: sizes.touchTarget.recommended,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  pressed: { backgroundColor: colors.surface.secondary },
  radio: {
    width: MARK,
    height: MARK,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center"
  },
  checkbox: {
    width: MARK,
    height: MARK,
    borderRadius: radius.small / 2,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center"
  },
  markOn: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary
  },
  markDisabled: { borderColor: colors.action.disabled },
  dot: {
    width: MARK / 2.6,
    height: MARK / 2.6,
    borderRadius: radius.full,
    backgroundColor: colors.text.inverse
  },
  name: { ...typography.role.body, flex: 1, color: colors.text.primary },
  muted: { color: colors.text.disabled },
  price: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  }
});
