import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType
} from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import coffeeArt from "../../../assets/categories/coffee.png";
import foodArt from "../../../assets/categories/food.png";
import milkTeaArt from "../../../assets/categories/milk-tea.png";
import type { HomeShortcut, StoreCategory } from "../../types/catalog";

/* Bundled category art; store and dish imagery comes from the API. */
const art: Record<StoreCategory, ImageSourcePropType> = {
  FOOD: foodArt,
  COFFEE: coffeeArt,
  MILK_TEA: milkTeaArt
};

type Props = {
  shortcuts: HomeShortcut[];
  active: StoreCategory;
  onSelect: (category: StoreCategory) => void;
};

export function CategoryTiles({ shortcuts, active, onSelect }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {shortcuts.map((shortcut) => {
        const selected = shortcut.key === active;
        return (
          <Pressable
            key={shortcut.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={shortcut.label}
            onPress={() => onSelect(shortcut.key)}
            style={({ pressed }) => [
              styles.tile,
              selected && styles.selected,
              pressed && !selected && styles.pressed
            ]}
          >
            <Image source={art[shortcut.key]} style={styles.art} />
            <Text
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={1}
            >
              {shortcut.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
  tile: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xxs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderRadius: radius.large,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  selected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySubtle
  },
  pressed: { backgroundColor: colors.surface.secondary },
  art: { width: 64, height: 64, borderRadius: radius.medium },
  label: { ...typography.role.label, color: colors.text.secondary },
  labelSelected: { color: colors.text.primary }
});
