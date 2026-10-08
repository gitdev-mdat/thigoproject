import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import type { AuthSession } from "../hooks/useAuthSession";
import { androidTopInset } from "../utils/layout";
import { maskPhone } from "../utils/phone";

type Props = { session: AuthSession };

export function HomeScreen({ session }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <BrandMark role="Khách hàng" />
          <Button
            label="Đăng xuất"
            loadingLabel="Đang đăng xuất…"
            variant="tertiary"
            loading={session.busy}
            onPress={() => void session.logout()}
          />
        </View>

        <View style={styles.greeting}>
          <Text style={styles.title} accessibilityRole="header">
            Hôm nay bạn muốn ăn gì?
          </Text>
          {session.user ? (
            <Text style={styles.help}>
              Đăng nhập với {maskPhone(session.user.phone)}
            </Text>
          ) : null}
        </View>

        <View style={styles.location} accessible>
          <Text style={styles.caption}>Giao đến</Text>
          <Text style={styles.itemTitle}>Chưa chọn địa chỉ</Text>
          <Text style={styles.help}>
            Chọn địa chỉ giao hàng sẽ có trong bản cập nhật tới.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Cửa hàng
            </Text>
          </View>
          <View style={styles.empty}>
            <Text style={styles.itemTitle}>Chưa có cửa hàng đang mở bán</Text>
            <Text style={styles.help}>
              Khi các cửa hàng bắt đầu bán trên THIGO, bạn sẽ thấy họ và thực
              đơn của họ ngay tại đây.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  scroll: {
    paddingTop: androidTopInset + spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  greeting: { gap: spacing.xxs },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  sectionTitle: { ...typography.role.sectionTitle, color: colors.text.primary },
  itemTitle: { ...typography.role.itemTitle, color: colors.text.primary },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  location: {
    padding: spacing.md,
    gap: spacing.xxs,
    borderRadius: radius.medium,
    backgroundColor: colors.surface.secondary
  },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  empty: {
    padding: spacing.lg,
    gap: spacing.xs,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle
  }
});
