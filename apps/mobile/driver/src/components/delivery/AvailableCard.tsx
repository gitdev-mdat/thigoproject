import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { Delivery } from "../../types/delivery";
import { formatItemCount, readiness } from "../../utils/delivery";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { Icon } from "../Icon";
import { CashToCollect } from "./CashToCollect";

type Props = {
  delivery: Delivery;
  loading: boolean;
  disabled: boolean;
  onClaim: () => void;
};

/** A claimable job: pickup -> drop-off, size, cash, and whether the food is ready. */
export function AvailableCard({ delivery, loading, disabled, onClaim }: Props) {
  const ready = readiness(delivery.status);
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Chip label={ready.label} tone={ready.tone} />
        <Text style={styles.meta}>
          {delivery.code} · {formatItemCount(delivery.itemCount)}
        </Text>
      </View>

      <View style={styles.route}>
        <View style={styles.leg}>
          <Icon name="bag" color={colors.text.secondary} />
          <View style={styles.legText}>
            <Text style={styles.store}>{delivery.storeName}</Text>
            <Text style={styles.line} numberOfLines={2}>
              {delivery.storeAddressLine}
            </Text>
          </View>
        </View>
        <View style={styles.leg}>
          <Icon name="pin" color={colors.text.secondary} />
          <View style={styles.legText}>
            <Text style={styles.caption}>Giao đến</Text>
            <Text style={styles.dropoff} numberOfLines={2}>
              {delivery.delivery.line}
            </Text>
          </View>
        </View>
      </View>

      <CashToCollect amount={delivery.totalVnd} compact />
      <Button
        label="Nhận đơn"
        loadingLabel="Đang nhận đơn…"
        prominent
        loading={loading}
        disabled={disabled}
        onPress={onClaim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  top: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs
  },
  meta: {
    ...typography.role.caption,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  },
  route: { gap: spacing.sm },
  leg: { flexDirection: "row", gap: spacing.sm },
  legText: { flex: 1, gap: spacing.xxs },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  store: { ...typography.role.itemTitle, color: colors.text.primary },
  line: { ...typography.role.bodySecondary, color: colors.text.secondary },
  dropoff: { ...typography.role.body, color: colors.text.primary }
});
