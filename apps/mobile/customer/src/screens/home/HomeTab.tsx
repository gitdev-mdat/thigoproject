import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { DishRow } from "../../components/home/DishRow";
import { Placeholder } from "../../components/home/Placeholder";
import { PromoBanner } from "../../components/home/PromoBanner";
import { RecentOrderCard } from "../../components/home/RecentOrderCard";
import { SearchBar } from "../../components/home/SearchBar";
import { SectionHeader } from "../../components/home/SectionHeader";
import { ShortcutGrid } from "../../components/home/ShortcutGrid";
import { StoreCard } from "../../components/home/StoreCard";
import type { CustomerHome } from "../../hooks/useCustomerHome";
import { usesDemoData } from "../../services/customerHome";
import type { StoreCategory } from "../../types/home";
import { androidTopInset } from "../../utils/layout";

const categoryTitle: Record<StoreCategory, string> = {
  food: "Quán ăn nổi bật",
  coffee: "Quán cà phê nổi bật",
  milk_tea: "Quán trà sữa nổi bật"
};

const dishTitle: Record<StoreCategory, string> = {
  food: "Món ăn được gọi nhiều",
  coffee: "Đồ uống được gọi nhiều",
  milk_tea: "Trà sữa được gọi nhiều"
};

type Props = {
  data: CustomerHome;
  initial: string;
  onOpenOrders: () => void;
  onOpenAccount: () => void;
};

export function HomeTab({ data, initial, onOpenOrders, onOpenAccount }: Props) {
  const { home, status } = data;
  const searching = data.query.trim().length > 0;
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.address} accessible>
            <Text style={styles.pin} accessible={false}>
              📍
            </Text>
            <View style={styles.addressText}>
              <Text style={styles.caption}>
                Giao đến{home ? ` · ${home.address.label}` : ""}
              </Text>
              {home ? (
                <Text style={styles.addressLine} numberOfLines={1}>
                  {home.address.line}
                </Text>
              ) : (
                <Placeholder width="80%" height={20} rounded="small" />
              )}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tài khoản"
            onPress={onOpenAccount}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </Pressable>
        </View>
        <View style={styles.greeting}>
          <Text style={styles.title} accessibilityRole="header">
            Hôm nay bạn muốn ăn gì?
          </Text>
          <Text style={styles.subtitle}>
            Đồ ăn, cà phê, trà sữa giao tận nơi.
          </Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={data.query} onChangeText={data.setQuery} />
      </View>

      <View style={styles.content}>
        {status === "error" ? (
          <View style={styles.errorCard}>
            <Text style={styles.itemTitle}>Chưa tải được trang chủ</Text>
            <Text style={styles.help}>Kiểm tra kết nối mạng rồi thử lại.</Text>
            <Button label="Thử lại" onPress={data.reload} />
          </View>
        ) : searching ? (
          <SearchResults data={data} />
        ) : (
          <>
            {home ? (
              <ShortcutGrid
                shortcuts={home.shortcuts}
                activeCategory={data.category}
                onSelectCategory={(category) =>
                  void data.selectCategory(category)
                }
                onOpenRecentOrders={onOpenOrders}
              />
            ) : (
              <View style={styles.shortcutPlaceholders}>
                {[0, 1, 2, 3].map((key) => (
                  <View key={key} style={styles.flex}>
                    <Placeholder height={104} rounded="large" />
                  </View>
                ))}
              </View>
            )}

            {status === "ready" && data.orders[0] ? (
              <View style={styles.section}>
                <SectionHeader
                  title="Đơn gần đây"
                  actionLabel="Xem tất cả"
                  onAction={onOpenOrders}
                />
                <RecentOrderCard
                  order={data.orders[0]}
                  onPress={onOpenOrders}
                />
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeader title={categoryTitle[data.category]} />
              {data.recommendationsLoading || !data.recommendations ? (
                data.recommendationsLoading ? (
                  <View style={styles.storePlaceholders}>
                    <Placeholder width={220} height={190} rounded="large" />
                    <Placeholder width={220} height={190} rounded="large" />
                  </View>
                ) : (
                  <Text style={styles.help}>Chưa tải được danh sách quán.</Text>
                )
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.storeRow}
                  style={styles.bleed}
                >
                  {data.recommendations.stores.map((store) => (
                    <StoreCard key={store.id} store={store} width={220} />
                  ))}
                </ScrollView>
              )}
            </View>

            {home?.promotions[0] ? (
              <PromoBanner promotion={home.promotions[0]} />
            ) : null}

            {data.recommendations && !data.recommendationsLoading ? (
              <View style={styles.section}>
                <SectionHeader title={dishTitle[data.category]} />
                <View>
                  {data.recommendations.dishes.map((dish, index) => (
                    <DishRow key={dish.id} dish={dish} divider={index > 0} />
                  ))}
                </View>
              </View>
            ) : null}

            {usesDemoData && status === "ready" ? (
              <Text style={styles.demo}>
                Dữ liệu minh hoạ cho bản phát triển.
              </Text>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function SearchResults({ data }: { data: CustomerHome }) {
  if (data.searchStatus === "loading")
    return (
      <View style={styles.section}>
        <Placeholder height={72} />
        <Placeholder height={72} />
      </View>
    );
  if (data.searchStatus === "error")
    return <Text style={styles.help}>Chưa tìm được. Vui lòng thử lại.</Text>;
  const results = data.searchResults;
  if (!results || (!results.stores.length && !results.dishes.length))
    return (
      <View style={styles.errorCard}>
        <Text style={styles.itemTitle}>
          Không tìm thấy “{data.query.trim()}”
        </Text>
        <Text style={styles.help}>
          Thử tên món khác, ví dụ “phở”, “bạc xỉu” hoặc “trà sữa”.
        </Text>
      </View>
    );
  return (
    <>
      {results.stores.length ? (
        <View style={styles.section}>
          <SectionHeader title={`Quán (${results.stores.length})`} />
          {results.stores.map((store) => (
            <StoreCard key={store.id} store={store} compact />
          ))}
        </View>
      ) : null}
      {results.dishes.length ? (
        <View style={styles.section}>
          <SectionHeader title={`Món (${results.dishes.length})`} />
          <View>
            {results.dishes.map((dish, index) => (
              <DishRow key={dish.id} dish={dish} divider={index > 0} />
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

const SEARCH_OVERLAP = sizes.control.input / 2;

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  flex: { flex: 1 },
  header: {
    paddingTop: androidTopInset + spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg + SEARCH_OVERLAP,
    gap: spacing.md,
    backgroundColor: colors.brand.primarySubtle,
    borderBottomLeftRadius: radius.large,
    borderBottomRightRadius: radius.large
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  address: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  pin: { fontSize: sizes.icon.large },
  addressText: { flex: 1, gap: spacing.xxs / 2 },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  addressLine: { ...typography.role.itemTitle, color: colors.text.primary },
  avatar: {
    width: sizes.touchTarget.recommended,
    height: sizes.touchTarget.recommended,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primary
  },
  pressed: { backgroundColor: colors.brand.primaryPressed },
  avatarText: { ...typography.role.itemTitle, color: colors.text.inverse },
  greeting: { gap: spacing.xxs },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  subtitle: { ...typography.role.body, color: colors.text.secondary },
  searchWrap: {
    marginTop: -SEARCH_OVERLAP,
    paddingHorizontal: spacing.md
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.lg
  },
  shortcutPlaceholders: { flexDirection: "row", gap: spacing.xs },
  section: { gap: spacing.sm },
  storePlaceholders: { flexDirection: "row", gap: spacing.sm },
  bleed: { marginHorizontal: -spacing.md },
  storeRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    gap: spacing.sm
  },
  itemTitle: { ...typography.role.itemTitle, color: colors.text.primary },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  errorCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  demo: {
    ...typography.role.caption,
    color: colors.text.secondary,
    textAlign: "center"
  }
});
