import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { Icon } from "../components/Icon";
import { TabBar, type HomeTab as Tab } from "../components/home/TabBar";
import type { AuthSession } from "../hooks/useAuthSession";
import { useCustomerHome } from "../hooks/useCustomerHome";
import { useScreenStack } from "../hooks/useScreenStack";
import { catalogApi } from "../services/catalog";
import { CartProvider, useCart } from "../stores/cart";
import type { Product, StoreDetail } from "../types/catalog";
import type { Address, OrderDetail } from "../types/orders";
import { describeStatus, isActive } from "../utils/orderStatus";
import { rebuildCart } from "../utils/reorder";
import { AddressScreen } from "./address/AddressScreen";
import { CartScreen } from "./cart/CartScreen";
import { CheckoutScreen } from "./checkout/CheckoutScreen";
import { AccountTab } from "./home/AccountTab";
import { HomeTab } from "./home/HomeTab";
import { OrdersTab } from "./home/OrdersTab";
import { OrderScreen } from "./orders/OrderScreen";
import { ProductScreen } from "./store/ProductScreen";
import { StoreScreen } from "./store/StoreScreen";

type Route =
  | { name: "tabs" }
  | { name: "store"; storeId: string; focusProductId?: string }
  | { name: "product"; store: StoreDetail; product: Product }
  | { name: "cart" }
  | { name: "address" }
  | { name: "checkout" }
  | { name: "order"; orderId: string; justPlaced?: boolean };

const ROOT: Route = { name: "tabs" };

type Props = { session: AuthSession };

export function CustomerApp({ session }: Props) {
  return (
    <CartProvider>
      <Shell session={session} />
    </CartProvider>
  );
}

function Shell({ session }: Props) {
  const [tab, setTab] = useState<Tab>("home");
  const stack = useScreenStack<Route>(ROOT);
  const home = useCustomerHome();
  const { cart, count, dispatch } = useCart();
  const { push, pop, reset } = stack;

  const openStore = useCallback(
    (storeId: string, focusProductId?: string) =>
      push(
        focusProductId
          ? { name: "store", storeId, focusProductId }
          : { name: "store", storeId }
      ),
    [push]
  );
  const openProduct = useCallback(
    (store: StoreDetail, product: Product) =>
      push({ name: "product", store, product }),
    [push]
  );
  const openCart = useCallback(() => push({ name: "cart" }), [push]);
  const goHome = useCallback(() => {
    reset();
    setTab("home");
  }, [reset]);
  const selectAddress = useCallback(
    (address: Address) => {
      home.setAddress(address);
      pop();
    },
    [home, pop]
  );
  const placed = useCallback(
    (order: OrderDetail) => {
      home.refresh();
      setTab("orders");
      reset({ name: "order", orderId: order.id, justPlaced: true });
    },
    [home, reset]
  );

  const reorder = async (order: OrderDetail) => {
    try {
      const store = await catalogApi.store(order.storeId);
      const { lines, skipped } = rebuildCart(store, order.items);
      if (!lines.length)
        return Alert.alert(
          "Chưa đặt lại được",
          "Các món trong đơn này hiện đã hết hoặc thay đổi. Hãy xem thực đơn mới của quán."
        );
      const apply = () => {
        dispatch({ type: "clear" });
        for (const line of lines)
          dispatch({
            type: "add",
            storeId: store.id,
            storeName: store.name,
            line
          });
        push({ name: "cart" });
        if (skipped.length)
          Alert.alert(
            "Một số món không còn",
            `Đã bỏ qua: ${skipped.join(", ")}. Giá trong giỏ là giá hiện tại.`
          );
      };
      if (count > 0 && cart.storeId)
        Alert.alert(
          "Thay giỏ hàng hiện tại?",
          "Giỏ hàng sẽ được thay bằng các món của đơn này.",
          [
            { text: "Giữ giỏ cũ", style: "cancel" },
            { text: "Thay giỏ hàng", style: "destructive", onPress: apply }
          ]
        );
      else apply();
    } catch {
      Alert.alert(
        "Chưa đặt lại được",
        "Quán có thể đang tạm ngưng. Vui lòng thử lại sau."
      );
    }
  };

  const route = stack.route;
  switch (route.name) {
    case "store":
      return (
        <StoreScreen
          key={route.storeId}
          storeId={route.storeId}
          {...(route.focusProductId
            ? { focusProductId: route.focusProductId }
            : {})}
          onBack={pop}
          onOpenProduct={openProduct}
          onOpenCart={openCart}
        />
      );
    case "product":
      return (
        <ProductScreen
          store={route.store}
          product={route.product}
          onClose={pop}
        />
      );
    case "cart":
      return (
        <CartScreen
          onBack={pop}
          onBrowse={goHome}
          onAddMore={(storeId) => {
            pop();
            openStore(storeId);
          }}
          onCheckout={() => push({ name: "checkout" })}
        />
      );
    case "address":
      return (
        <AddressScreen
          selectedId={home.address?.id ?? null}
          onBack={pop}
          onSelected={selectAddress}
        />
      );
    case "checkout":
      return (
        <CheckoutScreen
          address={home.address}
          onChangeAddress={() => push({ name: "address" })}
          onBack={pop}
          onPlaced={placed}
        />
      );
    case "order":
      return (
        <OrderScreen
          key={route.orderId}
          orderId={route.orderId}
          justPlaced={route.justPlaced ?? false}
          onBack={() => {
            home.refresh();
            pop();
          }}
          onReorder={(order) => void reorder(order)}
        />
      );
    case "tabs":
      break;
  }

  const recent = home.recentOrder;
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {tab === "home" ? (
          <HomeTab
            data={home}
            cartCount={count}
            addressSlot={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  home.address
                    ? `Giao đến ${home.address.label}, ${home.address.line}. Đổi địa chỉ`
                    : "Chọn địa chỉ giao hàng"
                }
                onPress={() => push({ name: "address" })}
                style={({ pressed }) => [
                  styles.address,
                  pressed && styles.pressed
                ]}
              >
                <Icon name="pin" color={colors.brand.primary} />
                <View style={styles.flex}>
                  <Text style={styles.caption}>
                    {home.address
                      ? `Giao đến · ${home.address.label}`
                      : "Giao đến"}
                  </Text>
                  <Text style={styles.addressLine} numberOfLines={1}>
                    {home.address?.line ?? "Chọn địa chỉ giao hàng"}
                  </Text>
                </View>
                <Icon
                  name="forward"
                  size={sizes.icon.small}
                  color={colors.text.secondary}
                />
              </Pressable>
            }
            recentOrders={
              recent
                ? {
                    title: isActive(recent.status)
                      ? "Đơn đang giao"
                      : "Đơn gần đây",
                    detail: `${recent.storeName} · ${describeStatus(recent).label}`
                  }
                : {
                    title: "Đơn gần đây",
                    detail: "Chưa có đơn nào. Đặt món đầu tiên nhé!"
                  }
            }
            onOpenStore={openStore}
            onOpenCart={openCart}
            onOpenOrders={() =>
              recent
                ? push({ name: "order", orderId: recent.id })
                : setTab("orders")
            }
          />
        ) : tab === "orders" ? (
          <OrdersTab
            onBrowse={() => setTab("home")}
            onOpenOrder={(orderId) => push({ name: "order", orderId })}
          />
        ) : (
          <AccountTab
            session={session}
            initial={session.user?.phone.slice(-1) ?? "K"}
          />
        )}
      </View>
      <TabBar active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  content: { flex: 1 },
  flex: { flex: 1 },
  address: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: sizes.touchTarget.recommended,
    borderRadius: radius.medium
  },
  pressed: { opacity: 0.7 },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  addressLine: { ...typography.role.label, color: colors.text.primary }
});
