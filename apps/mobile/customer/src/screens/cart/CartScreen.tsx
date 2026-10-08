import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { ScreenHeader } from "../../components/ScreenHeader";
import { CartLineRow } from "../../components/cart/CartLineRow";
import { useCart } from "../../stores/cart";
import { formatVnd } from "../../utils/format";

type Props = {
  onBack: () => void;
  onAddMore: (storeId: string) => void;
  onBrowse: () => void;
  onCheckout: () => void;
};

export function CartScreen({ onBack, onAddMore, onBrowse, onCheckout }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { cart, count, subtotal, dispatch } = useCart();
  const storeId = cart.storeId;

  if (!storeId)
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Giỏ hàng" onBack={onBack} />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="bag" size={32} color={colors.brand.primary} />
          </View>
          <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
          <Text style={styles.help}>
            Chọn món từ một quán, món sẽ được giữ ở đây khi bạn xem tiếp.
          </Text>
          <Button label="Khám phá món ngon" onPress={onBrowse} />
        </View>
      </View>
    );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Giỏ hàng"
        subtitle={cart.storeName}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {cart.lines.map((line) => (
          <CartLineRow
            key={line.key}
            line={line}
            onChangeQuantity={(quantity) =>
              dispatch({ type: "setQuantity", key: line.key, quantity })
            }
          />
        ))}
        <Button
          label="Thêm món từ quán này"
          variant="tertiary"
          style={styles.addMore}
          onPress={() => onAddMore(storeId)}
        />
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.help}>Tạm tính ({count} món)</Text>
            <Text style={styles.amount}>{formatVnd(subtotal)}</Text>
          </View>
          <Text style={styles.caption}>
            Phí giao hàng và tổng tiền do THIGO tính ở bước thanh toán.
          </Text>
        </View>
      </ScrollView>
      <View
        style={[styles.footer, { paddingBottom: Math.max(bottom, spacing.sm) }]}
      >
        <Button label="Đến bước thanh toán" prominent onPress={onCheckout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  addMore: { alignSelf: "flex-start", marginTop: spacing.xs },
  summary: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.large,
    backgroundColor: colors.surface.secondary
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  amount: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  help: { ...typography.role.body, color: colors.text.secondary },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primarySubtle
  },
  emptyTitle: { ...typography.role.sectionTitle, color: colors.text.primary }
});
