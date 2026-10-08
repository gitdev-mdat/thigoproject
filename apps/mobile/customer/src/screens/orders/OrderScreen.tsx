import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Placeholder } from "../../components/home/Placeholder";
import { usePolling } from "../../hooks/usePolling";
import { ApiError } from "../../services/api";
import { ordersApi } from "../../services/orders";
import type { OrderDetail } from "../../types/orders";
import { formatOrderDate, formatVnd } from "../../utils/format";
import {
  describeStatus,
  formatTime,
  isActive,
  trackingSteps
} from "../../utils/orderStatus";

/** Status refresh while an order is moving; there is no push channel yet. */
const POLL_MS = 5000;

type Props = {
  orderId: string;
  justPlaced?: boolean;
  onBack: () => void;
  onReorder: (order: OrderDetail) => void;
};

export function OrderScreen({
  orderId,
  justPlaced = false,
  onBack,
  onReorder
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const [order, setOrder] = useState<OrderDetail>();
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await ordersApi.detail(orderId));
      setError(undefined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Chưa tải được đơn hàng.");
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);
  usePolling(
    () => void load(),
    POLL_MS,
    order ? isActive(order.status) : false
  );

  const cancel = () =>
    Alert.alert(
      "Huỷ đơn hàng này?",
      "Quán chưa nhận đơn nên bạn có thể huỷ mà không mất phí.",
      [
        { text: "Giữ đơn", style: "cancel" },
        {
          text: "Huỷ đơn hàng",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              setOrder(await ordersApi.cancel(orderId));
            } catch (e) {
              Alert.alert(
                "Chưa huỷ được",
                e instanceof ApiError ? e.message : "Vui lòng thử lại."
              );
              void load();
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );

  if (!order)
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Đơn hàng" onBack={onBack} />
        <View style={styles.scroll}>
          {error ? (
            <View style={styles.card}>
              <Text style={styles.body}>{error}</Text>
              <Button label="Thử lại" onPress={() => void load()} />
            </View>
          ) : (
            <>
              <Placeholder height={120} rounded="large" />
              <Placeholder height={200} rounded="large" />
            </>
          )}
        </View>
      </View>
    );

  const status = describeStatus(order);
  const steps = trackingSteps(order);
  const closed = order.status === "REJECTED" || order.status === "CANCELLED";
  const heroTone =
    status.tone === "success"
      ? styles.heroSuccess
      : status.tone === "danger"
        ? styles.heroDanger
        : styles.heroProgress;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={order.storeName}
        subtitle={`Mã đơn ${order.code} · ${formatOrderDate(order.placedAt)}`}
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottom + spacing.xl }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {justPlaced && order.status === "PENDING" ? (
          <View style={styles.placed} accessibilityRole="alert">
            <Icon name="check" color={colors.status.success} />
            <Text style={styles.placedText}>
              Đặt đơn thành công. THIGO đã gửi đơn đến quán.
            </Text>
          </View>
        ) : null}

        <View style={[styles.hero, heroTone]} accessibilityLiveRegion="polite">
          <Text style={styles.heroLabel} accessibilityRole="header">
            {status.label}
          </Text>
          <Text style={styles.body}>
            {order.status === "REJECTED" && order.rejectReason
              ? `Lý do: ${order.rejectReason}`
              : status.detail}
          </Text>
          {isActive(order.status) ? (
            <Text style={styles.caption}>Tự cập nhật mỗi vài giây.</Text>
          ) : null}
        </View>

        {!closed ? (
          <View style={styles.card}>
            {steps.map((step, index) => (
              <View key={step.label} style={styles.step}>
                <View style={styles.rail}>
                  <View style={[styles.dot, step.done && styles.dotDone]}>
                    {step.done ? (
                      <Icon
                        name="check"
                        size={12}
                        color={colors.text.inverse}
                      />
                    ) : null}
                  </View>
                  {index < steps.length - 1 ? (
                    <View
                      style={[
                        styles.connector,
                        steps[index + 1]?.done && styles.connectorDone
                      ]}
                    />
                  ) : null}
                </View>
                <Text style={[styles.stepLabel, !step.done && styles.muted]}>
                  {step.label}
                </Text>
                <Text style={styles.caption}>
                  {step.at ? formatTime(step.at) : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Giao đến {order.delivery.label}
          </Text>
          <Text style={styles.body}>{order.delivery.line}</Text>
          {order.delivery.note ? (
            <Text style={styles.caption}>Ghi chú: {order.delivery.note}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chi tiết đơn</Text>
          {order.items.map((item, index) => (
            <View key={`${item.productId}-${index}`} style={styles.line}>
              <Text style={styles.qty}>{item.quantity}×</Text>
              <View style={styles.flex}>
                <Text style={styles.body}>{item.name}</Text>
                {item.options.length ? (
                  <Text style={styles.caption}>
                    {item.options.map((option) => option.name).join(" · ")}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.money}>{formatVnd(item.lineTotalVnd)}</Text>
            </View>
          ))}
          {order.customerNote ? (
            <Text style={styles.caption}>
              Ghi chú cho quán: {order.customerNote}
            </Text>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.body}>Tạm tính</Text>
            <Text style={styles.money}>{formatVnd(order.subtotalVnd)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.body}>Phí giao hàng</Text>
            <Text style={styles.money}>{formatVnd(order.deliveryFeeVnd)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.total}>Tiền mặt khi nhận</Text>
            <Text style={styles.total}>{formatVnd(order.totalVnd)}</Text>
          </View>
        </View>

        {order.status === "PENDING" ? (
          <Button
            label="Huỷ đơn hàng"
            variant="secondary"
            loading={cancelling}
            loadingLabel="Đang huỷ…"
            onPress={cancel}
          />
        ) : !isActive(order.status) ? (
          <Button
            label="Đặt lại các món này"
            onPress={() => onReorder(order)}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  flex: { flex: 1 },
  scroll: { padding: spacing.md, gap: spacing.sm },
  placed: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.medium,
    backgroundColor: colors.status.successBackground
  },
  placedText: {
    ...typography.role.label,
    flex: 1,
    color: colors.status.success
  },
  hero: { gap: spacing.xxs, padding: spacing.md, borderRadius: radius.large },
  heroProgress: { backgroundColor: colors.brand.primarySubtle },
  heroSuccess: { backgroundColor: colors.status.successBackground },
  heroDanger: { backgroundColor: colors.status.dangerBackground },
  heroLabel: {
    ...typography.role.screenTitle,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text.primary
  },
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.large,
    backgroundColor: colors.surface.primary
  },
  sectionTitle: { ...typography.role.itemTitle, color: colors.text.primary },
  body: { ...typography.role.body, color: colors.text.primary },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  muted: { color: colors.text.secondary },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    minHeight: 36
  },
  rail: { alignItems: "center", width: 20 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.primary
  },
  dotDone: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 14,
    backgroundColor: colors.border.subtle
  },
  connectorDone: { backgroundColor: colors.brand.primary },
  stepLabel: { ...typography.role.label, flex: 1, color: colors.text.primary },
  line: { flexDirection: "row", gap: spacing.xs, paddingVertical: spacing.xxs },
  qty: { ...typography.role.label, color: colors.text.secondary, minWidth: 28 },
  money: {
    ...typography.role.body,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  total: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  }
});
