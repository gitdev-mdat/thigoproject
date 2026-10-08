import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import type { AuthSession } from "../hooks/useAuthSession";
import { androidTopInset } from "../utils/layout";
import { maskPhone } from "../utils/phone";

type Props = { session: AuthSession };

export function HomeScreen({ session }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <BrandMark role="Tài xế" />
        </View>

        <View style={styles.status} accessible>
          <Chip label="Chưa có chuyến" />
          <Text style={styles.title} accessibilityRole="header">
            Hiện chưa có đơn giao
          </Text>
          <Text style={styles.body}>
            THIGO chưa mở giao hàng. Khi có chuyến dành cho bạn, chuyến sẽ hiện
            ngay tại đây.
          </Text>
        </View>

        <View style={styles.account}>
          <View style={styles.accountText}>
            <Text style={styles.caption}>Tài khoản Tài xế</Text>
            <Text style={styles.phone}>
              {session.user ? maskPhone(session.user.phone) : ""}
            </Text>
          </View>
          <Button
            label="Đăng xuất"
            loadingLabel="Đang đăng xuất…"
            variant="secondary"
            loading={session.busy}
            onPress={() => void session.logout()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  scroll: {
    flexGrow: 1,
    paddingTop: androidTopInset + spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md
  },
  header: {
    minHeight: spacing.xxl,
    flexDirection: "row",
    alignItems: "center"
  },
  status: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  body: { ...typography.role.body, color: colors.text.secondary },
  account: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  accountText: { flex: 1, gap: spacing.xxs },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  phone: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  }
});
