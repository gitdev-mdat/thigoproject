import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { QuantityStepper } from "../../components/QuantityStepper";
import { RemoteImage } from "../../components/RemoteImage";
import { OptionGroupField } from "../../components/store/OptionGroupField";
import { useCart } from "../../stores/cart";
import type { Product } from "../../types/catalog";
import {
  MAX_LINE_QUANTITY,
  defaultSelection,
  selectedOptions,
  selectionError,
  toggleOption,
  unitPrice
} from "../../utils/cart";
import { formatVnd } from "../../utils/format";

type Props = {
  store: { id: string; name: string };
  product: Product;
  onClose: () => void;
};

export function ProductScreen({ store, product, onClose }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const { cart, dispatch } = useCart();
  const [selection, setSelection] = useState(() => defaultSelection(product));
  const [quantity, setQuantity] = useState(1);
  const options = selectedOptions(product, selection);
  const error = selectionError(product, selection);
  const total =
    unitPrice({ basePriceVnd: product.priceVnd, options }) * quantity;

  const add = () => {
    dispatch({
      type: "add",
      storeId: store.id,
      storeName: store.name,
      line: {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        basePriceVnd: product.priceVnd,
        options,
        quantity
      }
    });
    onClose();
  };

  const confirmAdd = () => {
    if (!cart.storeId || cart.storeId === store.id) return add();
    Alert.alert(
      "Bắt đầu giỏ hàng mới?",
      `Giỏ hàng đang có món của ${cart.storeName}. Mỗi đơn chỉ đặt từ một quán, nên giỏ cũ sẽ bị xoá.`,
      [
        { text: "Giữ giỏ cũ", style: "cancel" },
        { text: "Tạo giỏ mới", style: "destructive", onPress: add }
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <RemoteImage
          url={product.imageUrl}
          style={[styles.image, { height: 260 + top }]}
        />
        <View style={styles.info}>
          <Text style={styles.title} accessibilityRole="header">
            {product.name}
          </Text>
          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}
          <Text style={styles.price}>{formatVnd(product.priceVnd)}</Text>
        </View>
        {product.optionGroups.map((group) => (
          <OptionGroupField
            key={group.id}
            group={group}
            selected={selection[group.id] ?? []}
            onToggle={(optionId) =>
              setSelection((current) => toggleOption(group, current, optionId))
            }
          />
        ))}
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Số lượng</Text>
          <QuantityStepper
            value={quantity}
            min={1}
            max={MAX_LINE_QUANTITY}
            itemName={product.name}
            onChange={setQuantity}
          />
        </View>
      </ScrollView>
      <View style={[styles.close, { top: top + spacing.xs }]}>
        <IconButton
          icon="close"
          label="Đóng"
          tone="floating"
          onPress={onClose}
        />
      </View>
      <View
        style={[styles.footer, { paddingBottom: Math.max(bottom, spacing.sm) }]}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={`Thêm vào giỏ · ${formatVnd(total)}`}
          prominent
          disabled={Boolean(error) || !product.isAvailable}
          onPress={confirmAdd}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  scroll: { paddingBottom: spacing.lg },
  image: { width: "100%" },
  close: { position: "absolute", right: spacing.md },
  info: { padding: spacing.md, gap: spacing.xs },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  description: { ...typography.role.body, color: colors.text.secondary },
  price: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 8,
    borderTopColor: colors.surface.secondary
  },
  quantityLabel: { ...typography.role.itemTitle, color: colors.text.primary },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  error: {
    ...typography.role.label,
    color: colors.status.warning,
    textAlign: "center"
  }
});
