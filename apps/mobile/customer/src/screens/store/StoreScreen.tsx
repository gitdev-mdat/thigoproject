import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { IconButton } from "../../components/IconButton";
import { RemoteImage } from "../../components/RemoteImage";
import { Placeholder } from "../../components/home/Placeholder";
import { CartBar } from "../../components/store/CartBar";
import { MenuItemRow } from "../../components/store/MenuItemRow";
import { useStoreMenu } from "../../hooks/useStoreMenu";
import { useCart } from "../../stores/cart";
import type { Product, StoreDetail } from "../../types/catalog";
import { categoryLabel } from "../../utils/storeLabels";

type Props = {
  storeId: string;
  focusProductId?: string;
  onBack: () => void;
  onOpenProduct: (store: StoreDetail, product: Product) => void;
  onOpenCart: () => void;
};

export function StoreScreen({
  storeId,
  focusProductId,
  onBack,
  onOpenProduct,
  onOpenCart
}: Props) {
  const { top } = useSafeAreaInsets();
  const { status, store, reload } = useStoreMenu(storeId);
  const { cart, count, subtotal } = useCart();
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const [navHeight, setNavHeight] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>();
  const focused = useRef(false);

  // A dish tapped on Home opens straight into its product details, once.
  useEffect(() => {
    if (!store || !focusProductId || focused.current) return;
    focused.current = true;
    const product = store.categories
      .flatMap((category) => category.products)
      .find((item) => item.id === focusProductId);
    if (product?.isAvailable) onOpenProduct(store, product);
  }, [store, focusProductId, onOpenProduct]);

  const cartHere = cart.storeId === storeId && count > 0;
  const quantities = new Map<string, number>();
  if (cart.storeId === storeId)
    for (const line of cart.lines)
      quantities.set(
        line.productId,
        (quantities.get(line.productId) ?? 0) + line.quantity
      );

  const floating = (
    <View style={[styles.floatingRow, { top: top + spacing.xs }]}>
      <IconButton
        icon="back"
        label="Quay lại"
        tone="floating"
        onPress={onBack}
      />
      <IconButton
        icon="bag"
        label="Giỏ hàng"
        tone="floating"
        badge={count}
        onPress={onOpenCart}
      />
    </View>
  );

  if (status !== "ready" || !store)
    return (
      <View style={styles.screen}>
        {status === "loading" ? (
          <View>
            <Placeholder height={200 + top} rounded="small" />
            <View style={styles.loadingBody}>
              <Placeholder width="70%" height={30} rounded="small" />
              <Placeholder width="90%" height={18} rounded="small" />
              <Placeholder height={96} />
              <Placeholder height={96} />
            </View>
          </View>
        ) : (
          <View style={[styles.center, { paddingTop: top }]}>
            <Text style={styles.itemTitle}>
              {status === "missing"
                ? "Quán này hiện không mở bán"
                : "Chưa tải được thực đơn"}
            </Text>
            <Text style={styles.help}>
              {status === "missing"
                ? "Quán có thể đã tạm ngưng. Hãy chọn quán khác nhé."
                : "Kiểm tra kết nối mạng rồi thử lại."}
            </Text>
            <Button
              label={status === "missing" ? "Về trang chủ" : "Thử lại"}
              onPress={status === "missing" ? onBack : () => void reload()}
            />
          </View>
        )}
        {floating}
      </View>
    );

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scroll}
        stickyHeaderIndices={[2]}
        contentContainerStyle={{
          paddingBottom: cartHere ? 120 : spacing.xl
        }}
      >
        <RemoteImage
          url={store.coverImageUrl}
          style={[styles.cover, { height: 196 + top }]}
        />
        <View style={styles.info}>
          <Text style={styles.title} accessibilityRole="header">
            {store.name}
          </Text>
          {store.description ? (
            <Text style={styles.description}>{store.description}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <Icon
              name="pin"
              size={sizes.icon.small}
              color={colors.text.secondary}
            />
            <Text style={styles.meta} numberOfLines={2}>
              {store.addressLine}
            </Text>
          </View>
          <Text style={styles.meta}>
            {categoryLabel[store.category]} · {store.productCount} món đang bán
          </Text>
          {!store.isOpen ? (
            <View style={styles.closed}>
              <Text style={styles.closedText}>
                Quán tạm hết món, chưa nhận đơn lúc này.
              </Text>
            </View>
          ) : null}
        </View>
        <View
          style={styles.nav}
          onLayout={(event) => setNavHeight(event.nativeEvent.layout.height)}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navContent}
          >
            {store.categories.map((category) => {
              const selected = category.id === activeCategory;
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  hitSlop={{ top: spacing.xxs, bottom: spacing.xxs }}
                  onPress={() => {
                    setActiveCategory(category.id);
                    scroll.current?.scrollTo({
                      y: (offsets.current[category.id] ?? 0) - navHeight,
                      animated: true
                    });
                  }}
                  style={[styles.navItem, selected && styles.navItemOn]}
                >
                  <Text style={[styles.navText, selected && styles.navTextOn]}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        {store.categories.map((category) => (
          <View
            key={category.id}
            style={styles.section}
            onLayout={(event) => {
              offsets.current[category.id] = event.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {category.name}
            </Text>
            {category.products.map((product) => (
              <MenuItemRow
                key={product.id}
                product={product}
                inCart={quantities.get(product.id) ?? 0}
                onPress={() => onOpenProduct(store, product)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      {floating}
      {cartHere ? (
        <CartBar count={count} subtotal={subtotal} onPress={onOpenCart} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  cover: { width: "100%" },
  floatingRow: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  info: {
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xxs,
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large,
    backgroundColor: colors.surface.primary
  },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  description: { ...typography.role.body, color: colors.text.secondary },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    marginTop: spacing.xxs
  },
  meta: {
    ...typography.role.bodySecondary,
    flexShrink: 1,
    color: colors.text.secondary
  },
  closed: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.medium,
    backgroundColor: colors.status.warningBackground
  },
  closedText: { ...typography.role.label, color: colors.status.warning },
  nav: {
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle
  },
  navContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs
  },
  navItem: {
    minHeight: sizes.control.compact,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface.secondary
  },
  navItemOn: { backgroundColor: colors.surface.inverse },
  navText: { ...typography.role.label, color: colors.text.primary },
  navTextOn: { color: colors.text.inverse },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  sectionTitle: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    marginBottom: spacing.xxs
  },
  loadingBody: { padding: spacing.md, gap: spacing.sm },
  center: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  itemTitle: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    textAlign: "center"
  },
  help: {
    ...typography.role.body,
    color: colors.text.secondary,
    textAlign: "center"
  }
});
