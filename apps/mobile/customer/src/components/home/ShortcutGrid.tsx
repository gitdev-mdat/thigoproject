import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { HomeShortcut, StoreCategory } from "../../types/home";
import { ArtTile } from "./ArtTile";

type Props = {
  shortcuts: HomeShortcut[];
  activeCategory: StoreCategory;
  onSelectCategory: (category: StoreCategory) => void;
  onOpenRecentOrders: () => void;
};

/** The four primary intents: three categories and the customer's recent orders. */
export function ShortcutGrid({
  shortcuts,
  activeCategory,
  onSelectCategory,
  onOpenRecentOrders
}: Props) {
  return (
    <View style={styles.grid}>
      {shortcuts.map((shortcut) => {
        const selected =
          shortcut.kind === "category" && shortcut.category === activeCategory;
        return (
          <Pressable
            key={shortcut.id}
            accessibilityRole={shortcut.kind === "category" ? "tab" : "button"}
            accessibilityState={
              shortcut.kind === "category" ? { selected } : {}
            }
            accessibilityLabel={shortcut.label}
            onPress={() =>
              shortcut.kind === "category"
                ? onSelectCategory(shortcut.category)
                : onOpenRecentOrders()
            }
            style={({ pressed }) => [
              styles.item,
              selected && styles.selected,
              pressed && styles.pressed
            ]}
          >
            <ArtTile
              art={shortcut.art}
              size={52}
              tone={selected ? "surface" : "brand"}
              rounded="full"
            />
            <Text
              style={[styles.label, selected && styles.selectedLabel]}
              numberOfLines={2}
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
  grid: { flexDirection: "row", gap: spacing.xs },
  item: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xxs,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  selected: {
    borderColor: colors.brand.primary,
    borderWidth: 2,
    backgroundColor: colors.brand.primarySubtle
  },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  label: {
    ...typography.role.label,
    color: colors.text.primary,
    textAlign: "center"
  },
  selectedLabel: { color: colors.text.link }
});
