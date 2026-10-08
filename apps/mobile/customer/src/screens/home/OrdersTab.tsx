import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { Placeholder } from "../../components/home/Placeholder";
import { RecentOrderCard } from "../../components/home/RecentOrderCard";
import type { CustomerHome } from "../../hooks/useCustomerHome";
import { androidTopInset } from "../../utils/layout";

type Props = { data: CustomerHome };

export function OrdersTab({ data }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title} accessibilityRole="header">
        Đơn hàng
      </Text>
      {data.status === "loading" ? (
        <View style={styles.list}>
          <Placeholder height={84} rounded="large" />
          <Placeholder height={84} rounded="large" />
        </View>
      ) : data.orders.length ? (
        <View style={styles.list}>
          <Text style={styles.caption}>Đơn gần đây</Text>
          {data.orders.map((order) => (
            <RecentOrderCard key={order.id} order={order} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.itemTitle}>Bạn chưa có đơn nào</Text>
          <Text style={styles.help}>
            Đơn bạn đặt sẽ hiện ở đây để theo dõi và xem lại.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: androidTopInset + spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg
  },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  list: { gap: spacing.sm },
  caption: { ...typography.role.label, color: colors.text.secondary },
  empty: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle
  },
  itemTitle: { ...typography.role.itemTitle, color: colors.text.primary },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary }
});
