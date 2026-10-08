import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, sizes, spacing } from "@thigo/design-tokens";

import { TabBar, TABS, type TabKey } from "../components/shell/TabBar";
import { Toast, type ToastMessage } from "../components/Toast";
import type { AuthSession } from "../hooks/useAuthSession";
import { useOrderBoard } from "../hooks/useOrderBoard";
import { useScreenStack } from "../hooks/useScreenStack";
import type { Storefront } from "../hooks/useStorefront";
import { CatalogScreen } from "./catalog/CatalogScreen";
import { ProductFormScreen } from "./catalog/ProductFormScreen";
import { HomeScreen } from "./home/HomeScreen";
import { OrderBoardScreen } from "./OrderBoardScreen";
import type { Navigation, Notify, Route } from "./routes";
import { OpeningHoursScreen } from "./store/OpeningHoursScreen";
import { StoreProfileScreen } from "./store/StoreProfileScreen";
import { StoreScreen } from "./store/StoreScreen";

const ROOT: Route = { name: "tabs" };

type Props = {
  session: AuthSession;
  storefront: Storefront;
  /** True right after first-time setup, to greet with the next step. */
  justCreated: boolean;
};

/**
 * Four tabs with a small drill-in stack over them. Tabs stay mounted once
 * visited so scroll position and drafts survive switching; the order board
 * lives here so polling and the new-order badge work on every tab.
 */
export function MerchantShell({ session, storefront, justCreated }: Props) {
  const orders = useOrderBoard();
  const stack = useScreenStack<Route>(ROOT);
  const { bottom } = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>("home");
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set(["home"]));
  const [addCategoryRequest, setAddCategoryRequest] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [tabBarHeight, setTabBarHeight] = useState(0);
  const onTabs = stack.depth === 1;
  const { loadCatalog } = storefront;

  const notify = useCallback<Notify>((message, tone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (justCreated)
      notify("Đã tạo cửa hàng. Tiếp theo, tạo danh mục và thêm món đầu tiên.");
  }, [justCreated, notify]);

  const goTab = useCallback((key: TabKey) => {
    setTab(key);
    setVisited((current) =>
      current.has(key) ? current : new Set([...current, key])
    );
  }, []);

  // Android back on another tab returns to Tổng quan before leaving the app.
  useEffect(() => {
    if (!onTabs || tab === "home") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        goTab("home");
        return true;
      }
    );
    return () => subscription.remove();
  }, [onTabs, tab, goTab]);

  const { push, back, reset, setBackGuard } = stack;
  const nav = useMemo<Navigation>(
    () => ({
      goTab: (key) => {
        reset();
        goTab(key);
      },
      openProduct: (productId, categoryId) =>
        push({ name: "product", productId, categoryId }),
      openStoreProfile: () => push({ name: "storeProfile" }),
      openHours: () => push({ name: "hours" }),
      addCategory: () => {
        reset();
        goTab("menu");
        setAddCategoryRequest((count) => count + 1);
      },
      back,
      setBackGuard
    }),
    [push, back, reset, setBackGuard, goTab]
  );

  const newOrders =
    orders.board?.active.filter((order) => order.status === "PENDING").length ??
    0;

  const renderTab = (key: TabKey) => {
    const focused = onTabs && tab === key;
    switch (key) {
      case "home":
        return (
          <HomeScreen
            storefront={storefront}
            orders={orders}
            focused={focused}
            nav={nav}
            notify={notify}
          />
        );
      case "orders":
        return <OrderBoardScreen session={session} orders={orders} />;
      case "menu":
        return (
          <CatalogScreen
            storefront={storefront}
            focused={focused}
            addCategoryRequest={addCategoryRequest}
            nav={nav}
            notify={notify}
          />
        );
      case "store":
        return (
          <StoreScreen
            session={session}
            storefront={storefront}
            focused={focused}
            nav={nav}
            notify={notify}
          />
        );
    }
  };

  const route = stack.route;
  const pushed =
    route.name === "product" ? (
      <ProductFormScreen
        key={route.productId ?? "new"}
        productId={route.productId}
        initialCategoryId={route.categoryId}
        storefront={storefront}
        nav={nav}
        notify={notify}
      />
    ) : route.name === "storeProfile" ? (
      <StoreProfileScreen storefront={storefront} nav={nav} notify={notify} />
    ) : route.name === "hours" ? (
      <OpeningHoursScreen storefront={storefront} nav={nav} notify={notify} />
    ) : null;

  return (
    <View style={styles.screen}>
      <View
        style={styles.flex}
        accessibilityElementsHidden={!onTabs}
        importantForAccessibility={onTabs ? "auto" : "no-hide-descendants"}
      >
        <View style={styles.flex}>
          {TABS.filter(({ key }) => visited.has(key)).map(({ key }) => (
            <View
              key={key}
              style={[styles.flex, key !== tab && styles.hidden]}
              accessibilityElementsHidden={key !== tab}
              importantForAccessibility={
                key === tab ? "auto" : "no-hide-descendants"
              }
            >
              {renderTab(key)}
            </View>
          ))}
        </View>
        <View
          onLayout={(event) => setTabBarHeight(event.nativeEvent.layout.height)}
        >
          <TabBar value={tab} onChange={goTab} badges={{ orders: newOrders }} />
        </View>
      </View>
      {pushed ? <View style={styles.overlay}>{pushed}</View> : null}
      <Toast
        toast={toast}
        onDismiss={dismissToast}
        offset={
          onTabs
            ? tabBarHeight + spacing.sm
            : bottom + sizes.control.prominent + spacing.lg
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  flex: { flex: 1 },
  hidden: { display: "none" },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface.secondary
  }
});
