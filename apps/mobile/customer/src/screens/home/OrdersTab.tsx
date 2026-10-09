import { useState } from "react";
import {
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
import { Placeholder } from "../../components/home/Placeholder";
import { OrderCard } from "../../components/orders/OrderCard";
import { useOrders } from "../../hooks/useOrders";
import { isActive } from "../../utils/orderStatus";

type Props = { onBrowse: () => void; onOpenOrder: (id: string) => void };

export function OrdersTab({ onBrowse, onOpenOrder }: Props) {
  const { top } = useSafeAreaInsets();
  const { status, orders, reload } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const active = orders.filter((order) => isActive(order.status));
  const past = orders.filter((order) => !isActive(order.status));
  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingTop: top + spacing.md }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await reload(true);
            setRefreshing(false);
          }}
        />
      }
    >
      <Text style={styles.title} accessibilityRole="header">
        Đơn hàng
      </Text>
      {status === "loading" ? (
        [0, 1, 2].map((key) => (
          <Placeholder key={key} height={90} rounded="large" />
        ))
      ) : status === "error" ? (
        <View style={styles.empty}>
          <Text style={styles.itemTitle}>Chưa tải được đơn hàng</Text>
          <Button label="Thử lại" onPress={() => void reload()} />
        </View>
      ) : !orders.length ? (
        <View style={styles.empty}>
          <Icon name="receipt" size={32} color={colors.brand.primary} />
          <Text style={styles.itemTitle}>Chưa có đơn hàng nào</Text>
          <Text style={styles.help}>
            Đơn bạn đặt sẽ hiển thị ở đây cùng trạng thái giao hàng.
          </Text>
          <Button label="Khám phá món ngon" onPress={onBrowse} />
        </View>
      ) : (
        <>
          {active.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Đang thực hiện
              </Text>
              {active.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => onOpenOrder(order.id)}
                />
              ))}
            </View>
          ) : null}
          {past.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Lịch sử đơn
              </Text>
              {past.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => onOpenOrder(order.id)}
                />
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md
  },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.role.itemTitle, color: colors.text.secondary },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.large,
    backgroundColor: colors.surface.secondary
  },
  itemTitle: { ...typography.role.itemTitle, color: colors.text.primary },
  help: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    textAlign: "center"
  }
});
