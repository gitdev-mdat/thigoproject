import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import type { Product } from "../../types/catalog";
import { formatVnd } from "../../utils/format";
import { Icon } from "../Icon";
import { RemoteImage } from "../RemoteImage";

type Props = { product: Product; inCart: number; onPress: () => void };

export function MenuItemRow({ product, inCart, onPress }: Props) {
  const available = product.isAvailable;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatVnd(product.priceVnd)}${available ? "" : ", hết món"}${inCart ? `, đã có ${inCart} trong giỏ` : ""}`}
      accessibilityState={{ disabled: !available }}
      disabled={!available}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text
          style={[styles.name, !available && styles.muted]}
          numberOfLines={2}
        >
          {product.name}
        </Text>
        {product.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={[styles.price, !available && styles.muted]}>
            {formatVnd(product.priceVnd)}
          </Text>
          {!available ? (
            <Text style={styles.soldOut}>Hết món</Text>
          ) : inCart ? (
            <Text style={styles.inCart}>{inCart} trong giỏ</Text>
          ) : null}
        </View>
      </View>
      <View>
        <RemoteImage
          url={product.imageUrl}
          style={[styles.image, !available && styles.imageMuted]}
        />
        {available ? (
          <View style={styles.add}>
            <Icon
              name="plus"
              size={sizes.icon.small}
              color={colors.text.inverse}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const IMAGE = 96;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle
  },
  pressed: { backgroundColor: colors.surface.secondary },
  text: { flex: 1, gap: spacing.xxs },
  name: { ...typography.role.itemTitle, color: colors.text.primary },
  muted: { color: colors.text.disabled },
  description: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xxs
  },
  price: {
    ...typography.role.label,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  soldOut: {
    ...typography.role.caption,
    color: colors.status.warning,
    backgroundColor: colors.status.warningBackground,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.small,
    overflow: "hidden"
  },
  inCart: { ...typography.role.caption, color: colors.status.success },
  image: { width: IMAGE, height: IMAGE, borderRadius: radius.medium },
  imageMuted: { opacity: 0.45 },
  add: {
    position: "absolute",
    right: -spacing.xxs,
    bottom: -spacing.xxs,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primary,
    borderWidth: 2,
    borderColor: colors.surface.primary
  }
});
