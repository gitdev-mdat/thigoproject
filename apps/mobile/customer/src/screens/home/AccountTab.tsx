import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { BrandMark } from "../../components/BrandMark";
import { Button } from "../../components/Button";
import type { AuthSession } from "../../hooks/useAuthSession";
import { maskPhone } from "../../utils/phone";

type Props = { session: AuthSession; initial: string };

export function AccountTab({ session, initial }: Props) {
  const { top } = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingTop: top + spacing.md }]}
    >
      <Text style={styles.title} accessibilityRole="header">
        Tài khoản
      </Text>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.caption}>Đăng nhập bằng số điện thoại</Text>
          <Text style={styles.phone}>
            {session.user ? maskPhone(session.user.phone) : ""}
          </Text>
        </View>
      </View>
      <Button
        label="Đăng xuất"
        loadingLabel="Đang đăng xuất…"
        variant="secondary"
        loading={session.busy}
        onPress={() => void session.logout()}
      />
      <View style={styles.footer}>
        <BrandMark role="Khách hàng" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg
  },
  flex: { flex: 1, gap: spacing.xxs },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.large,
    backgroundColor: colors.brand.primarySubtle
  },
  avatar: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primary
  },
  avatarText: { ...typography.role.sectionTitle, color: colors.text.inverse },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  phone: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  footer: { alignItems: "center", marginTop: spacing.lg }
});
