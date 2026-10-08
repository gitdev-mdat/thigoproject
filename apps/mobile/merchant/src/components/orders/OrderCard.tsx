import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import type { MerchantOrder, OrderAction } from "../../types/orders";
import { describeStatus, nextStep, showsDriverState } from "../../utils/board";
import { elapsedMinutes, formatPlacedAt, formatVnd } from "../../utils/format";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { Icon } from "../Icon";

/** A new order waiting this long is flagged so it is not forgotten. */
export const PENDING_ATTENTION_MINUTES = 5;

type Props = {
  order: MerchantOrder;
  now: number;
  /** The action in flight for this order, if any. */
  pendingAction: OrderAction | null;
  /** Another order's action is in flight; this card waits. */
  locked: boolean;
  onAdvance: (order: MerchantOrder) => void;
  onReject: (order: MerchantOrder) => void;
};

function OrderCardView({
  order,
  now,
  pendingAction,
  locked,
  onAdvance,
  onReject
}: Props) {
  const status = describeStatus(order.status);
  const step = nextStep(order.status);
  const waiting =
    order.status === "PENDING" &&
    elapsedMinutes(order.placedAt, now) >= PENDING_ATTENTION_MINUTES;
  const busy = pendingAction !== null;

  return (
    <View style={[styles.card, waiting && styles.cardAttention]}>
      <View style={styles.head}>
        <View style={styles.identity}>
          <Text style={styles.code} accessibilityRole="header">
            #{order.code}
          </Text>
          <Text style={[styles.time, waiting && styles.timeAttention]}>
            {formatPlacedAt(order.placedAt, now)}
          </Text>
        </View>
        <Chip label={status.label} tone={status.tone} />
      </View>

      <View style={styles.items}>
        {order.items.map((line, index) => (
          <View key={`${line.productId}-${index}`} style={styles.line}>
            <Text style={styles.quantity}>{line.quantity}×</Text>
            <View style={styles.lineText}>
              <Text style={styles.itemName}>{line.name}</Text>
              {line.options.map((option) => (
                <Text
                  key={`${option.groupName}-${option.name}`}
                  style={styles.option}
                >
                  {option.groupName}: {option.name}
                </Text>
              ))}
            </View>
            <Text style={styles.lineTotal}>{formatVnd(line.lineTotalVnd)}</Text>
          </View>
        ))}
      </View>

      {order.customerNote ? (
        <View style={styles.note}>
          <Text style={styles.noteLabel}>Ghi chú của khách</Text>
          <Text style={styles.noteText}>{order.customerNote}</Text>
        </View>
      ) : null}

      {order.status === "REJECTED" && order.rejectReason ? (
        <Text style={styles.meta}>Lý do từ chối: {order.rejectReason}</Text>
      ) : null}

      <View style={styles.totalRow}>
        <View style={styles.flex}>
          <Text style={styles.payment}>Thu tiền mặt</Text>
          <Text style={styles.meta}>
            Gồm phí giao {formatVnd(order.deliveryFeeVnd)}
          </Text>
        </View>
        <Text style={styles.total}>{formatVnd(order.totalVnd)}</Text>
      </View>

      {showsDriverState(order.status) ? (
        <Chip
          label={order.driverAssigned ? "Đã có tài xế" : "Chưa có tài xế"}
          tone={order.driverAssigned ? "success" : "neutral"}
        />
      ) : null}

      {order.status === "PENDING" && step ? (
        <View style={styles.actions}>
          <Button
            label="Từ chối"
            variant="danger"
            disabled={busy || locked}
            onPress={() => onReject(order)}
            style={styles.secondaryAction}
          />
          <Button
            label={step.label}
            loadingLabel={step.loadingLabel}
            loading={pendingAction === step.action}
            disabled={busy || locked}
            onPress={() => onAdvance(order)}
            style={styles.primaryAction}
          />
        </View>
      ) : step ? (
        <Button
          label={step.label}
          loadingLabel={step.loadingLabel}
          loading={pendingAction === step.action}
          disabled={busy || locked}
          onPress={() => onAdvance(order)}
        />
      ) : order.status === "READY_FOR_PICKUP" ? (
        <View style={styles.waiting} accessible>
          <Icon name="bag" color={colors.status.success} />
          <Text style={styles.waitingText}>Chờ tài xế lấy món</Text>
        </View>
      ) : null}
    </View>
  );
}

export const OrderCard = memo(OrderCardView);

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  cardAttention: { borderColor: colors.status.warning },
  flex: { flex: 1 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  identity: { flex: 1, gap: spacing.xxs },
  code: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  time: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  },
  timeAttention: { ...typography.role.label, color: colors.status.warning },
  items: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle
  },
  line: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  quantity: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    minWidth: spacing.xl,
    fontVariant: ["tabular-nums"]
  },
  lineText: { flex: 1, gap: spacing.xxs },
  itemName: { ...typography.role.itemTitle, color: colors.text.primary },
  option: { ...typography.role.bodySecondary, color: colors.text.secondary },
  lineTotal: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  },
  note: {
    gap: spacing.xxs,
    padding: spacing.sm,
    borderRadius: radius.small,
    backgroundColor: colors.status.warningBackground
  },
  noteLabel: { ...typography.role.caption, color: colors.status.warning },
  noteText: { ...typography.role.label, color: colors.status.warning },
  meta: { ...typography.role.bodySecondary, color: colors.text.secondary },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle
  },
  payment: { ...typography.role.label, color: colors.text.primary },
  total: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  actions: { flexDirection: "row", gap: spacing.sm },
  secondaryAction: { flex: 1 },
  primaryAction: { flex: 2 },
  waiting: {
    minHeight: sizes.touchTarget.recommended,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.medium,
    backgroundColor: colors.status.successBackground
  },
  waitingText: { ...typography.role.label, color: colors.status.success }
});
