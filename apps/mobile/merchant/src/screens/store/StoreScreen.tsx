import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { AccountSheet } from "../../components/AccountSheet";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ConfirmSheet } from "../../components/ConfirmSheet";
import { Notice } from "../../components/Notice";
import { ToggleRow } from "../../components/ToggleRow";
import { StoreImageField } from "../../components/store/StoreImageField";
import type { AuthSession } from "../../hooks/useAuthSession";
import type { Storefront } from "../../hooks/useStorefront";
import { setPublished } from "../../services/storefront";
import { summarizeHours, todayHours } from "../../utils/hours";
import { maskPhone } from "../../utils/phone";
import {
  publishBlockers,
  storeCategoryLabel,
  toLocalPhone
} from "../../utils/storefront";
import type { Navigation, Notify } from "../routes";

type Props = {
  session: AuthSession;
  storefront: Storefront;
  focused: boolean;
  nav: Navigation;
  notify: Notify;
};

/** Cửa hàng: profile, images, hours, visibility and the account. */
export function StoreScreen({
  session,
  storefront,
  focused,
  nav,
  notify
}: Props) {
  const { top } = useSafeAreaInsets();
  const { overview, loadOverview } = storefront;
  const [refreshing, setRefreshing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [confirmHide, setConfirmHide] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const firstFocus = useRef(true);

  useEffect(() => {
    if (!focused) return;
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    void loadOverview();
  }, [focused, loadOverview]);

  const store = overview?.store;
  if (!overview || !store) return null;
  const blockers = publishBlockers(overview);
  const phone = session.user ? maskPhone(session.user.phone) : undefined;

  const refresh = async () => {
    setRefreshing(true);
    await loadOverview();
    setRefreshing(false);
  };

  const changePublished = async (published: boolean) => {
    setPublishing(true);
    setPublishError("");
    const result = await storefront.mutateStore(() => setPublished(published));
    setPublishing(false);
    if (!result.ok) return setPublishError(result.message);
    setConfirmHide(false);
    notify(
      published
        ? "Cửa hàng đã hiển thị với khách trên THIGO."
        : "Đã ẩn cửa hàng. Khách không còn thấy cửa hàng.",
      published ? "success" : "warning"
    );
  };

  const detail = (label: string, value: string, missing = false) => (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, missing && styles.missing]}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      {focused ? <StatusBar style="dark" /> : null}
      <View style={[styles.header, { paddingTop: top + spacing.xs }]}>
        <Text style={styles.title} accessibilityRole="header">
          Cửa hàng
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            colors={[colors.brand.primary]}
            tintColor={colors.brand.primary}
          />
        }
      >
        <Card
          title="Hiển thị với khách"
          subtitle="Khi bật, khách tìm thấy cửa hàng và xem thực đơn trên THIGO."
        >
          <ToggleRow
            prominent
            title={store.isPublished ? "Đang hiển thị" : "Đang ẩn"}
            description={
              store.isPublished
                ? "Tắt để ẩn cửa hàng khỏi ứng dụng khách."
                : overview.canPublish
                  ? "Bật để khách bắt đầu thấy và đặt món."
                  : `Chưa thể hiển thị: ${blockers.join(" ")}`
            }
            value={store.isPublished}
            disabled={
              publishing || (!store.isPublished && !overview.canPublish)
            }
            onChange={(value) =>
              value ? void changePublished(true) : setConfirmHide(true)
            }
          />
          {store.isPublished && blockers.length ? (
            <Notice
              tone="warning"
              message={`Còn thiếu: ${blockers.join(" ")}`}
            />
          ) : null}
          {publishError && !confirmHide ? (
            <Notice message={publishError} tone="danger" />
          ) : null}
        </Card>

        <Card
          title="Thông tin cửa hàng"
          action={
            <Button
              label="Sửa"
              variant="tertiary"
              onPress={nav.openStoreProfile}
            />
          }
        >
          {detail("Tên", store.name)}
          {detail("Loại cửa hàng", storeCategoryLabel(store.category))}
          {detail("Địa chỉ", store.addressLine)}
          {detail(
            "Số điện thoại",
            store.phone ? toLocalPhone(store.phone) : "Chưa có, cần bổ sung",
            !store.phone
          )}
          {detail(
            "Giới thiệu",
            store.description ?? "Chưa có",
            !store.description
          )}
        </Card>

        <Card
          title="Giờ mở cửa"
          subtitle={`${summarizeHours(store.openingHours)} · ${todayHours(store.openingHours)}`}
          action={
            <Button label="Sửa" variant="tertiary" onPress={nav.openHours} />
          }
        />

        <Card
          title="Ảnh cửa hàng"
          subtitle="Ảnh bìa và logo giúp khách nhận ra quán của bạn."
        >
          <StoreImageField
            kind="cover"
            store={store}
            storefront={storefront}
            onSaved={(message) => notify(message)}
          />
          <StoreImageField
            kind="logo"
            store={store}
            storefront={storefront}
            onSaved={(message) => notify(message)}
          />
        </Card>

        <Card title="Tài khoản">
          <Text style={styles.body}>
            {phone ? `Đang đăng nhập với ${phone}.` : "Đang đăng nhập."}
          </Text>
          <Button
            label="Đăng xuất"
            variant="danger"
            onPress={() => setAccountOpen(true)}
          />
        </Card>
      </ScrollView>

      <ConfirmSheet
        visible={confirmHide}
        title="Ẩn cửa hàng?"
        body={`Khách sẽ không tìm thấy “${store.name}” và không đặt được món mới. Đơn đang xử lý vẫn tiếp tục. Bạn có thể hiển thị lại bất cứ lúc nào.`}
        confirmLabel="Ẩn cửa hàng"
        loadingLabel="Đang ẩn…"
        cancelLabel="Tiếp tục hiển thị"
        destructive
        busy={publishing}
        error={publishError}
        onCancel={() => {
          setConfirmHide(false);
          setPublishError("");
        }}
        onConfirm={() => void changePublished(false)}
      />
      <AccountSheet
        visible={accountOpen}
        phone={phone}
        storeName={store.name}
        busy={session.busy}
        onClose={() => setAccountOpen(false)}
        onLogout={() => void session.logout()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  title: { ...typography.role.sectionTitle, color: colors.text.primary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  detail: { gap: spacing.xxs },
  detailLabel: { ...typography.role.caption, color: colors.text.secondary },
  detailValue: { ...typography.role.body, color: colors.text.primary },
  missing: { color: colors.status.warning },
  body: { ...typography.role.body, color: colors.text.primary }
});
