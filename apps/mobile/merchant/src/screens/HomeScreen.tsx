import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import type { AuthSession } from "../hooks/useAuthSession";
import { androidTopInset } from "../utils/layout";
import { maskPhone } from "../utils/phone";

const areas = [
  {
    title: "Cửa hàng",
    detail: "Tên, mô tả, ảnh và trạng thái mở bán"
  },
  {
    title: "Danh mục",
    detail: "Nhóm món để khách dễ tìm trong thực đơn"
  },
  {
    title: "Món bán",
    detail: "Tên món, giá, ảnh và tình trạng còn hàng"
  }
];

type Props = { session: AuthSession };

export function HomeScreen({ session }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <BrandMark role="Nhà bán hàng" />
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
            Cửa hàng của bạn
          </Text>
          {session.user ? (
            <Text style={styles.help}>
              Đăng nhập với {maskPhone(session.user.phone)}
            </Text>
          ) : null}
        </View>

        <View style={styles.nextStep}>
          <Chip label="Bước tiếp theo" tone="brand" />
          <Text style={styles.sectionTitle}>Thiết lập cửa hàng</Text>
          <Text style={styles.body}>
            Đặt tên và mô tả ngắn cho cửa hàng, sau đó thêm danh mục và món bán
            để khách hàng xem được thực đơn của bạn.
          </Text>
          <Button
            label="Thiết lập cửa hàng"
            prominent
            disabled
            onPress={noop}
          />
          <Text style={styles.help}>
            Chức năng thiết lập cửa hàng đang được hoàn thiện.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Quản lý
          </Text>
          <View style={styles.list}>
            {areas.map((area, index) => (
              <View
                key={area.title}
                accessible
                style={[styles.row, index > 0 && styles.rowDivider]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.itemTitle}>{area.title}</Text>
                  <Text style={styles.help}>{area.detail}</Text>
                </View>
                <Chip label="Sắp có" />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const noop = () => undefined;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
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
  body: { ...typography.role.body, color: colors.text.primary },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  nextStep: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  section: { gap: spacing.sm },
  list: {
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border.subtle },
  rowText: { flex: 1, gap: spacing.xxs }
});
