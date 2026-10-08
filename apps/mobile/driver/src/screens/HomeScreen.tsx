import { StatusBar } from "expo-status-bar";
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

import { Button } from "../components/Button";
import { Notice } from "../components/Notice";
import { Placeholder } from "../components/Placeholder";
import { AccountRow } from "../components/delivery/AccountRow";
import { ActionBar } from "../components/delivery/ActionBar";
import { AvailableCard } from "../components/delivery/AvailableCard";
import { CurrentDelivery } from "../components/delivery/CurrentDelivery";
import { DeliveredState } from "../components/delivery/DeliveredState";
import { DeliveryHeader } from "../components/delivery/DeliveryHeader";
import { HistoryList } from "../components/delivery/HistoryList";
import type { AuthSession } from "../hooks/useAuthSession";
import { useDeliveries } from "../hooks/useDeliveries";
import {
  deliverConfirmation,
  deliveryStage,
  formatClock
} from "../utils/delivery";

type Props = { session: AuthSession };

/** Driver home: the current job when there is one, otherwise jobs to claim. */
export function HomeScreen({ session }: Props) {
  const { bottom } = useSafeAreaInsets();
  const deliveries = useDeliveries();
  const { overview, pending, delivered } = deliveries;
  const current = overview?.current ?? null;
  const stage = current ? deliveryStage(current.status) : null;
  const job = current && stage && !delivered ? { current, stage } : null;
  const updated = deliveries.updatedAt
    ? formatClock(deliveries.updatedAt)
    : null;
  const headerStatus = !updated
    ? "Đang tải…"
    : deliveries.stale
      ? `Mất kết nối · ${updated}`
      : `Cập nhật lúc ${updated}`;

  const runStageAction = () => {
    if (!job) return;
    const {
      current: delivery,
      stage: { action }
    } = job;
    if (action.kind === "pickup") deliveries.pickup(delivery.id);
    if (action.kind === "deliver") {
      const copy = deliverConfirmation(delivery);
      Alert.alert(copy.title, copy.message, [
        { text: "Chưa giao", style: "cancel" },
        { text: copy.confirm, onPress: () => deliveries.deliver(delivery.id) }
      ]);
    }
  };

  const logout = () => {
    if (!current) return void session.logout();
    Alert.alert(
      "Đăng xuất khi đang có đơn?",
      `Đơn ${current.code} vẫn được giữ cho bạn. Đăng nhập lại để tiếp tục giao.`,
      [
        { text: "Ở lại", style: "cancel" },
        { text: "Đăng xuất", onPress: () => void session.logout() }
      ]
    );
  };

  const body = () => {
    if (delivered)
      return (
        <DeliveredState
          delivery={delivered}
          onDone={deliveries.dismissDelivered}
        />
      );
    if (!overview) {
      if (deliveries.status === "error")
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle} accessibilityRole="header">
              Chưa tải được đơn giao
            </Text>
            <Text style={styles.body}>{deliveries.error}</Text>
            <Button label="Thử lại" prominent onPress={deliveries.reload} />
          </View>
        );
      return (
        <View
          style={styles.loading}
          accessible
          accessibilityLabel="Đang tải đơn giao"
        >
          {[0, 1].map((key) => (
            <View key={key} style={styles.card}>
              <Placeholder width="40%" height={20} rounded="small" />
              <Placeholder height={48} />
              <Placeholder height={56} />
            </View>
          ))}
        </View>
      );
    }
    if (job)
      return <CurrentDelivery delivery={job.current} stage={job.stage} />;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {overview.available.length
            ? `Đơn cần giao (${overview.available.length})`
            : "Đơn cần giao"}
        </Text>
        {overview.available.length ? (
          overview.available.map((delivery) => (
            <AvailableCard
              key={delivery.id}
              delivery={delivery}
              loading={pending?.id === delivery.id}
              disabled={pending !== undefined}
              onClaim={() => deliveries.claim(delivery.id)}
            />
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Chưa có đơn cần giao. Đơn mới sẽ tự hiện ở đây.
            </Text>
            {updated ? (
              <Text style={styles.caption}>Cập nhật lúc {updated}</Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <DeliveryHeader status={headerStatus} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: job ? spacing.lg : bottom + spacing.xl }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={deliveries.refreshing}
            onRefresh={deliveries.refresh}
            colors={[colors.brand.primary]}
            tintColor={colors.brand.primary}
          />
        }
      >
        {deliveries.notice ? (
          <Notice message={deliveries.notice} tone="warning" />
        ) : null}
        {body()}
        {overview && !job && !delivered ? (
          <HistoryList deliveries={overview.history} />
        ) : null}
        <View style={styles.account}>
          <AccountRow
            phone={session.user?.phone}
            busy={session.busy}
            onLogout={logout}
          />
        </View>
      </ScrollView>
      {job ? (
        <ActionBar
          action={job.stage.action}
          loading={pending?.id === job.current.id}
          onPress={runStageAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md
  },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.role.sectionTitle, color: colors.text.primary },
  loading: { gap: spacing.sm },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  cardTitle: { ...typography.role.itemTitle, color: colors.text.primary },
  body: { ...typography.role.body, color: colors.text.secondary },
  caption: {
    ...typography.role.caption,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  },
  account: { marginTop: "auto", paddingTop: spacing.lg }
});
