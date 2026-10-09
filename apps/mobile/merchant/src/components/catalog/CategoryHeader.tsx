import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@thigo/design-tokens";

import type { MerchantCategory } from "../../types/storefront";
import { Chip } from "../Chip";
import { IconButton } from "../IconButton";

type Props = {
  category: MerchantCategory;
  onActions: (category: MerchantCategory) => void;
};

/** Section title for one category with its management actions. */
export function CategoryHeader({ category, onActions }: Props) {
  const available = category.products.filter((item) => item.isAvailable).length;
  return (
    <View style={styles.header}>
      <View style={styles.text}>
        <Text style={styles.title} accessibilityRole="header">
          {category.name}
        </Text>
        <View style={styles.meta}>
          {!category.isActive ? (
            <Chip label="Đang ẩn với khách" tone="warning" />
          ) : null}
          <Text style={styles.count}>
            {category.products.length
              ? `${category.products.length} món · ${available} đang bán`
              : "Chưa có món"}
          </Text>
        </View>
      </View>
      <IconButton
        icon="more"
        label={`Tuỳ chọn danh mục ${category.name}`}
        onPress={() => onActions(category)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface.secondary
  },
  text: { flex: 1, gap: spacing.xxs },
  title: { ...typography.role.sectionTitle, color: colors.text.primary },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs
  },
  count: { ...typography.role.caption, color: colors.text.secondary }
});
