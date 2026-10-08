import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { AccountSheet } from "../components/AccountSheet";
import { Button } from "../components/Button";
import { Notice } from "../components/Notice";
import { StatePanel } from "../components/StatePanel";
import { BoardHeader } from "../components/orders/BoardHeader";
import { OrderCard } from "../components/orders/OrderCard";
import { OrderCardSkeleton } from "../components/orders/OrderCardSkeleton";
import { RejectSheet } from "../components/orders/RejectSheet";
import { SegmentTabs } from "../components/orders/SegmentTabs";
import type { AuthSession } from "../hooks/useAuthSession";
import { useNow } from "../hooks/useNow";
import { useOrderBoard } from "../hooks/useOrderBoard";
import type { MerchantOrder } from "../types/orders";
import {
  SEGMENTS,
  defaultSegment,
  groupOrders,
  nextStep,
  type SegmentKey
} from "../utils/board";
import { formatClock } from "../utils/format";
import { maskPhone } from "../utils/phone";

type Props = { session: AuthSession };

/** Merchant home: the store's order queues and the next action on each order. */
export function OrderBoardScreen({ session }: Props) {
  const orders = useOrderBoard();
  const { board, phase, pending, act, reportError } = orders;
  const now = useNow(15_000);
  const { bottom } = useSafeAreaInsets();
  const [segment, setSegment] = useState<SegmentKey>();
  const [rejecting, setRejecting] = useState<MerchantOrder | null>(null);
  const [rejectError, setRejectError] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);

  const groups = useMemo(
    () => (board ? groupOrders(board) : undefined),
    [board]
  );
  const counts = useMemo(
    () =>
      groups && {
        new: groups.new.length,
        doing: groups.doing.length,
        ready: groups.ready.length,
        done: groups.done.length
      },
    [groups]
  );

  // The first board picks the starting queue; after that the choice is the user's.
  useEffect(() => {
    if (!segment && groups) setSegment(defaultSegment(groups));
  }, [groups, segment]);
  const current = segment ?? "new";
  const meta = SEGMENTS.find((item) => item.key === current) ?? SEGMENTS[0]!;

  const advance = useCallback(
    async (order: MerchantOrder) => {
      const step = nextStep(order.status);
      if (!step) return;
      const result = await act(order, step.action);
      if (!result.ok && !result.settled && result.message)
        reportError(result.message);
    },
    [act, reportError]
  );

  const openReject = useCallback((order: MerchantOrder) => {
    setRejectError("");
    setRejecting(order);
  }, []);

  const confirmReject = async (reason: string) => {
    if (!rejecting) return;
    setRejectError("");
    const result = await act(rejecting, "reject", reason);
    if (result.ok || result.settled) setRejecting(null);
    else if (result.message) setRejectError(result.message);
  };

  const phone = session.user ? maskPhone(session.user.phone) : undefined;
  const header = (
    <BoardHeader
      title={board?.store.name ?? "Đơn hàng"}
      subtitle={board?.store.addressLine}
      paused={board ? !board.store.isActive : false}
      onAccount={() => setAccountOpen(true)}
    />
  );
  const accountSheet = (
    <AccountSheet
      visible={accountOpen}
      phone={phone}
      storeName={board?.store.name}
      busy={session.busy}
      onClose={() => setAccountOpen(false)}
      onLogout={() => void session.logout()}
    />
  );

  if (phase === "unauthorized")
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        {header}
        <StatePanel
          title="Phiên đăng nhập đã hết hạn"
          body="Đăng nhập lại để tiếp tục nhận đơn trên thiết bị này."
        >
          <Button
            label="Đăng nhập lại"
            loadingLabel="Đang đăng xuất…"
            loading={session.busy}
            onPress={() => void session.logout()}
          />
        </StatePanel>
      </View>
    );

  if (phase === "noStore")
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        {header}
        <View style={styles.center}>
          <StatePanel
            title={orders.error || "Tài khoản này chưa có cửa hàng."}
            body={`${phone ? `Số ${phone}` : "Tài khoản này"} đã có quyền Nhà bán hàng nhưng chưa được gắn với cửa hàng nào, nên chưa có đơn để nhận. Liên hệ THIGO để được thiết lập cửa hàng, sau đó bấm Kiểm tra lại.`}
          >
            <Button
              label="Kiểm tra lại"
              variant="secondary"
              onPress={orders.retry}
            />
            <Button
              label="Đăng xuất"
              variant="tertiary"
              onPress={() => setAccountOpen(true)}
            />
          </StatePanel>
        </View>
        {accountSheet}
      </View>
    );

  const listPadding = { paddingBottom: bottom + spacing.xl };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      {header}
      <View style={styles.controls}>
        <SegmentTabs value={current} counts={counts} onChange={setSegment} />
        <Text
          style={[styles.freshness, orders.stale && styles.stale]}
          accessibilityLiveRegion="polite"
        >
          {orders.updatedAt
            ? `Cập nhật lúc ${formatClock(orders.updatedAt)}`
            : phase === "loading"
              ? "Đang tải đơn hàng…"
              : "Chưa cập nhật được"}
          {orders.stale && board ? " · Mất kết nối, đang thử lại" : ""}
        </Text>
        {orders.notice ? (
          <Notice
            key={orders.notice.id}
            message={orders.notice.message}
            tone={orders.notice.tone}
            onDismiss={orders.dismissNotice}
          />
        ) : null}
      </View>

      {phase === "loading" ? (
        <View style={[styles.list, listPadding]}>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </View>
      ) : phase === "error" && !board ? (
        <StatePanel
          title="Chưa tải được đơn hàng"
          body={`${orders.error} Ứng dụng vẫn tự thử lại mỗi vài giây.`}
        >
          <Button label="Thử lại" onPress={orders.retry} />
        </StatePanel>
      ) : (
        <FlatList
          data={groups?.[current] ?? []}
          keyExtractor={(order) => order.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              now={now}
              pendingAction={
                pending?.orderId === item.id ? pending.action : null
              }
              locked={pending !== null && pending.orderId !== item.id}
              onAdvance={advance}
              onReject={openReject}
            />
          )}
          extraData={now}
          contentContainerStyle={[styles.list, listPadding]}
          ListEmptyComponent={
            <StatePanel title={meta.emptyTitle} body={meta.emptyBody} />
          }
          refreshControl={
            <RefreshControl
              refreshing={orders.refreshing}
              onRefresh={() => void orders.pullToRefresh()}
              colors={[colors.brand.primary]}
              tintColor={colors.brand.primary}
            />
          }
        />
      )}

      <RejectSheet
        order={rejecting}
        busy={pending?.action === "reject"}
        error={rejectError}
        onCancel={() => setRejecting(null)}
        onConfirm={(reason) => void confirmReject(reason)}
      />
      {accountSheet}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  center: { flex: 1, justifyContent: "center" },
  controls: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  freshness: {
    ...typography.role.caption,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  },
  stale: { color: colors.status.danger },
  list: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  }
});
