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

import { BrandMark } from "../../components/BrandMark";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Notice } from "../../components/Notice";
import {
  SetupChecklist,
  type SetupAction
} from "../../components/store/SetupChecklist";
import { StatTile } from "../../components/store/StatTile";
import { StoreIdentity } from "../../components/store/StoreIdentity";
import { StoreStatusCard } from "../../components/store/StoreStatusCard";
import type { OrderBoardState } from "../../hooks/useOrderBoard";
import type { Storefront } from "../../hooks/useStorefront";
import { setAcceptingOrders, setPublished } from "../../services/storefront";
import type { SetupStepKey } from "../../types/storefront";
import { publishBlockers, setupProgress } from "../../utils/storefront";
import type { Navigation, Notify } from "../routes";

type Props = {
  storefront: Storefront;
  orders: OrderBoardState;
  focused: boolean;
  nav: Navigation;
  notify: Notify;
};

/** Tổng quan: store state, what to do next and real counts. */
export function HomeScreen({
  storefront,
  orders,
  focused,
  nav,
  notify
}: Props) {
  const { top } = useSafeAreaInsets();
  const { overview, loadOverview } = storefront;
  const [accepting, setAccepting] = useState(false);
  const [acceptingError, setAcceptingError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const firstFocus = useRef(true);

  // Refresh whenever the owner comes back to this tab.
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
  const counts = overview.catalog;
  const progress = setupProgress(overview.setup);
  const blockers = publishBlockers(overview);
  const activeOrders = orders.board?.active.length;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOverview(), orders.pullToRefresh()]);
    setRefreshing(false);
  };

  const changeAccepting = async (value: boolean) => {
    setAccepting(true);
    setAcceptingError("");
    const result = await storefront.mutateStore(() =>
      setAcceptingOrders(value)
    );
    setAccepting(false);
    if (!result.ok) return setAcceptingError(result.message);
    notify(
      value
        ? "Đã mở nhận đơn."
        : "Đã tạm ngưng nhận đơn. Khách chưa đặt được món mới.",
      value ? "success" : "warning"
    );
  };

  const publish = async () => {
    setPublishing(true);
    const result = await storefront.mutateStore(() => setPublished(true));
    setPublishing(false);
    if (result.ok) notify("Cửa hàng đã hiển thị với khách trên THIGO.");
    else notify(result.message, "danger");
  };

  const actionFor = (key: SetupStepKey): SetupAction | undefined => {
    switch (key) {
      case "PROFILE":
        return { label: "Bổ sung thông tin", onPress: nav.openStoreProfile };
      case "IMAGES":
        return {
          label: "Thêm logo và ảnh bìa",
          onPress: () => nav.goTab("store")
        };
      case "MENU":
        if (counts.categoryCount === 0)
          return { label: "Tạo danh mục đầu tiên", onPress: nav.addCategory };
        if (counts.productCount === 0)
          return {
            label: "Thêm món đầu tiên",
            onPress: () => nav.openProduct()
          };
        return { label: "Mở thực đơn", onPress: () => nav.goTab("menu") };
      case "PUBLISH":
        return {
          label: "Hiển thị cửa hàng",
          loadingLabel: "Đang bật hiển thị…",
          onPress: () => void publish(),
          disabled: !overview.canPublish,
          loading: publishing,
          reason: overview.canPublish
            ? undefined
            : `Chưa thể hiển thị: ${blockers.join(" ")}`
        };
    }
  };

  return (
    <View style={styles.screen}>
      {focused ? <StatusBar style="dark" /> : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: top + spacing.sm }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            colors={[colors.brand.primary]}
            tintColor={colors.brand.primary}
          />
        }
      >
        <View style={styles.top}>
          <BrandMark role="Nhà bán hàng" />
        </View>
        {storefront.phase === "ready" && storefront.error ? (
          <Notice
            message={`Chưa cập nhật được số liệu mới nhất. ${storefront.error}`}
            tone="warning"
          />
        ) : null}

        <StoreIdentity store={store} />
        <StoreStatusCard
          store={store}
          busy={accepting}
          error={acceptingError}
          onAcceptingChange={(value) => void changeAccepting(value)}
        />

        {store.isPublished && !overview.canPublish ? (
          <Notice
            tone="warning"
            message={`Cửa hàng đang hiển thị nhưng còn thiếu thông tin: ${blockers.join(" ")}`}
          />
        ) : null}
        {counts.productCount > 0 && counts.availableCount === 0 ? (
          <View style={styles.warning}>
            <Notice
              tone="warning"
              message="Tất cả món đang tạm hết, nên khách chưa đặt được món nào. Bật lại món còn bán trong Thực đơn."
            />
            <Button
              label="Mở thực đơn"
              variant="secondary"
              onPress={() => nav.goTab("menu")}
            />
          </View>
        ) : null}

        {progress.complete ? null : (
          <SetupChecklist steps={overview.setup} actionFor={actionFor} />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Hiện tại
          </Text>
          <View style={styles.grid}>
            <StatTile
              label="Đơn đang xử lý"
              value={activeOrders}
              emphasis={(activeOrders ?? 0) > 0}
              onPress={() => nav.goTab("orders")}
            />
            <StatTile
              label="Món đang bán"
              value={counts.availableCount}
              onPress={() => nav.goTab("menu")}
            />
            <StatTile
              label="Món tạm hết"
              value={counts.unavailableCount}
              onPress={() => nav.goTab("menu")}
            />
            <StatTile
              label="Danh mục"
              value={counts.categoryCount}
              onPress={() => nav.goTab("menu")}
            />
          </View>
        </View>

        <Card title="Thao tác nhanh">
          {counts.categoryCount > 0 ? (
            <Button label="Thêm món" onPress={() => nav.openProduct()} />
          ) : (
            <>
              <Button label="Tạo danh mục" onPress={nav.addCategory} />
              <Text style={styles.help}>
                Tạo danh mục trước, ví dụ “Món chính”, rồi thêm món vào đó.
              </Text>
            </>
          )}
          <Button
            label="Xem đơn hàng"
            variant="secondary"
            onPress={() => nav.goTab("orders")}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md
  },
  top: { paddingVertical: spacing.xs },
  warning: { gap: spacing.xs },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.role.sectionTitle, color: colors.text.primary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary }
});
