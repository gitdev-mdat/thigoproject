import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { MAX_LINE_QUANTITY, unitPrice, type CartLine } from "../../utils/cart";
import { formatVnd } from "../../utils/format";
import { QuantityStepper } from "../QuantityStepper";
import { RemoteImage } from "../RemoteImage";

type Props = { line: CartLine; onChangeQuantity: (quantity: number) => void };

export function CartLineRow({ line, onChangeQuantity }: Props) {
  const options = line.options.map((option) => option.name).join(" · ");
  return (
    <View style={styles.row}>
      <RemoteImage url={line.imageUrl} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {line.name}
        </Text>
        {options ? (
          <Text style={styles.options} numberOfLines={2}>
            {options}
          </Text>
        ) : null}
        <View style={styles.bottom}>
          <Text style={styles.price}>
            {formatVnd(unitPrice(line) * line.quantity)}
          </Text>
          <QuantityStepper
            value={line.quantity}
            max={MAX_LINE_QUANTITY}
            itemName={line.name}
            onChange={onChangeQuantity}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle
  },
  image: { width: 64, height: 64, borderRadius: radius.medium },
  body: { flex: 1, gap: 2 },
  name: { ...typography.role.itemTitle, color: colors.text.primary },
  options: { ...typography.role.bodySecondary, color: colors.text.secondary },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -spacing.xxs
  },
  price: {
    ...typography.role.label,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  }
});
