import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@thigo/design-tokens";

import type { MerchantProduct } from "../../types/storefront";
import { formatVnd } from "../../utils/format";
import { optionLabel } from "../../utils/storefront";
import { Chip } from "../Chip";
import { Toggle } from "../Toggle";
import { ProductThumb } from "./ProductThumb";

const THUMB = 64;

type Props = {
  product: MerchantProduct;
  /** True while this product's availability change is being saved. */
  saving: boolean;
  onOpen: (product: MerchantProduct) => void;
  onToggle: (product: MerchantProduct, value: boolean) => void;
};

/**
 * One product: the details open the editor; the switch beside them changes
 * availability. They are siblings, so the two targets never compete.
 */
export const ProductRow = memo(function ProductRow({
  product,
  saving,
  onOpen,
  onToggle
}: Props) {
  const options = optionLabel(product.optionGroupCount);
  const price = formatVnd(product.priceVnd);
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${price}${options ? `, ${options}` : ""}${product.isAvailable ? "" : ", đang tạm hết"}`}
        accessibilityHint="Mở để sửa món"
        onPress={() => onOpen(product)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <ProductThumb
          name={product.name}
          imageUrl={product.imageUrl}
          size={THUMB}
        />
        <View style={styles.text}>
          <Text
            style={[styles.name, !product.isAvailable && styles.muted]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          <Text style={styles.price}>{price}</Text>
          {options || !product.isAvailable ? (
            <View style={styles.chips}>
              {!product.isAvailable ? (
                <Chip label="Tạm hết" tone="warning" />
              ) : null}
              {options ? <Chip label={options} /> : null}
            </View>
          ) : null}
        </View>
      </Pressable>
      <Toggle
        value={product.isAvailable}
        disabled={saving}
        label={`Còn bán ${product.name}`}
        onValueChange={(value) => onToggle(product, value)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.xs,
    backgroundColor: colors.surface.primary
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md
  },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  text: { flex: 1, gap: spacing.xxs },
  name: { ...typography.role.itemTitle, color: colors.text.primary },
  muted: { color: colors.text.secondary },
  price: {
    ...typography.role.bodySecondary,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xxs }
});
