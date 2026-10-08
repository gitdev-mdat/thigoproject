import { ScrollView, StyleSheet, Text, View } from "react-native";
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
import { CategoryTiles } from "../../components/home/CategoryTiles";
import { DishCard } from "../../components/home/DishCard";
import { Placeholder } from "../../components/home/Placeholder";
import { RecentOrdersEntry } from "../../components/home/RecentOrdersEntry";
import { SearchBar } from "../../components/home/SearchBar";
import { SectionHeader } from "../../components/home/SectionHeader";
import { StoreCard } from "../../components/home/StoreCard";
import type { CustomerHome } from "../../hooks/useCustomerHome";
import type { StoreCategory } from "../../types/catalog";

const storesTitle: Record<StoreCategory, string> = {
  FOOD: "Quán ăn",
  COFFEE: "Quán cà phê",
  MILK_TEA: "Quán trà sữa"
};

const dishesTitle: Record<StoreCategory, string> = {
  FOOD: "Món ngon nên thử",
  COFFEE: "Đồ uống nên thử",
  MILK_TEA: "Ly ngon nên thử"
};

type Props = {
  data: CustomerHome;
  cartCount: number;
  addressSlot: React.ReactNode;
  recentOrders: { title: string; detail: string };
  onOpenStore: (storeId: string, productId?: string) => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
};

export function HomeTab({
  data,
  cartCount,
  addressSlot,
  recentOrders,
  onOpenStore,
  onOpenCart,
  onOpenOrders
}: Props) {
  const { top } = useSafeAreaInsets();
  const searching = data.query.trim().length > 0;
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={[styles.header, { paddingTop: top + spacing.sm }]}>
        <View style={styles.topRow}>
          <View style={styles.flex}>{addressSlot}</View>
          <IconButton
            icon="bag"
            label="Giỏ hàng"
            badge={cartCount}
            tone="floating"
            onPress={onOpenCart}
          />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Hôm nay bạn muốn ăn gì?
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={data.query} onChangeText={data.setQuery} />
      </View>

      <View style={styles.content}>
        {data.status === "error" ? (
          <ErrorCard onRetry={data.reload} />
        ) : searching ? (
          <SearchResults data={data} onOpenStore={onOpenStore} />
        ) : (
          <>
            {data.status === "loading" ? (
              <View style={styles.tilePlaceholders}>
                {[0, 1, 2].map((key) => (
                  <View key={key} style={styles.flex}>
                    <Placeholder height={112} rounded="large" />
                  </View>
                ))}
              </View>
            ) : (
              <CategoryTiles
                shortcuts={data.shortcuts}
                active={data.category}
                onSelect={(category) => void data.selectCategory(category)}
              />
            )}

            <RecentOrdersEntry
              title={recentOrders.title}
              detail={recentOrders.detail}
              onPress={onOpenOrders}
            />

            <Recommendations data={data} onOpenStore={onOpenStore} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Recommendations({
  data,
  onOpenStore
}: Pick<Props, "data" | "onOpenStore">) {
  const result = data.recommendations;
  if (data.recommendationsStatus === "error")
    return (
      <View style={styles.notice}>
        <Text style={styles.help}>Chưa tải được danh sách quán.</Text>
        <Button
          label="Thử lại"
          variant="secondary"
          onPress={() => void data.selectCategory(data.category)}
        />
      </View>
    );
  if (!result || data.recommendationsStatus === "loading")
    return (
      <View style={styles.section}>
        <Placeholder width="50%" height={26} rounded="small" />
        <View style={styles.rail}>
          <Placeholder width={156} height={190} rounded="large" />
          <Placeholder width={156} height={190} rounded="large" />
          <Placeholder width={156} height={190} rounded="large" />
        </View>
        <Placeholder height={200} rounded="large" />
      </View>
    );
  if (!result.stores.length)
    return (
      <View style={styles.notice}>
        <Text style={styles.itemTitle}>Chưa có quán nào mở bán</Text>
        <Text style={styles.help}>
          Quán sẽ xuất hiện ở đây ngay khi bắt đầu nhận đơn.
        </Text>
      </View>
    );
  return (
    <>
      {result.dishes.length ? (
        <View style={styles.section}>
          <SectionHeader title={dishesTitle[data.category]} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.railContent}
          >
            {result.dishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                onPress={() => onOpenStore(dish.storeId, dish.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionHeader
          title={`${storesTitle[data.category]} (${result.stores.length})`}
        />
        {result.stores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            onPress={() => onOpenStore(store.id)}
          />
        ))}
      </View>
    </>
  );
}

function SearchResults({
  data,
  onOpenStore
}: Pick<Props, "data" | "onOpenStore">) {
  if (data.searchStatus === "error")
    return <ErrorCard onRetry={data.retrySearch} />;
  if (data.searchStatus === "loading" || !data.searchResults)
    return (
      <View style={styles.section}>
        {[0, 1, 2].map((key) => (
          <Placeholder key={key} height={72} />
        ))}
      </View>
    );
  const results = data.searchResults;
  if (!results.stores.length && !results.dishes.length)
    return (
      <View style={styles.notice}>
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
            <StoreCard
              key={store.id}
              store={store}
              compact
              onPress={() => onOpenStore(store.id)}
            />
          ))}
        </View>
      ) : null}
      {results.dishes.length ? (
        <View style={styles.section}>
          <SectionHeader title={`Món (${results.dishes.length})`} />
          {results.dishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              layout="row"
              onPress={() => onOpenStore(dish.storeId, dish.id)}
            />
          ))}
        </View>
      ) : null}
    </>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.notice}>
      <View style={styles.noticeTitle}>
        <Icon
          name="close"
          size={sizes.icon.small}
          color={colors.status.danger}
        />
        <Text style={styles.itemTitle}>Chưa kết nối được THIGO</Text>
      </View>
      <Text style={styles.help}>Kiểm tra kết nối mạng rồi thử lại.</Text>
      <Button label="Thử lại" onPress={onRetry} />
    </View>
  );
}

const SEARCH_OVERLAP = sizes.control.input / 2;

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md + SEARCH_OVERLAP,
    gap: spacing.sm,
    backgroundColor: colors.brand.primarySubtle,
    borderBottomLeftRadius: radius.large,
    borderBottomRightRadius: radius.large
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  searchWrap: { marginTop: -SEARCH_OVERLAP, paddingHorizontal: spacing.md },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg
  },
  tilePlaceholders: { flexDirection: "row", gap: spacing.xs },
  section: { gap: spacing.sm },
  rail: { flexDirection: "row", gap: spacing.sm, overflow: "hidden" },
  bleed: { marginHorizontal: -spacing.md },
  railContent: { paddingHorizontal: spacing.md, gap: spacing.sm },
  itemTitle: { ...typography.role.itemTitle, color: colors.text.primary },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  notice: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  noticeTitle: { flexDirection: "row", alignItems: "center", gap: spacing.xs }
});
