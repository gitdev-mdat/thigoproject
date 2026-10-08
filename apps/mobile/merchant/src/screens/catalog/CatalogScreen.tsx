import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  elevation,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Notice } from "../../components/Notice";
import { StatePanel } from "../../components/StatePanel";
import {
  CategoryActionsSheet,
  type CategoryAction
} from "../../components/catalog/CategoryActionsSheet";
import { CategoryHeader } from "../../components/catalog/CategoryHeader";
import { CategoryNameSheet } from "../../components/catalog/CategoryNameSheet";
import { CatalogSkeleton } from "../../components/catalog/CatalogSkeleton";
import { ProductRow } from "../../components/catalog/ProductRow";
import type { Storefront } from "../../hooks/useStorefront";
import {
  createCategory,
  deleteCategory,
  moveCategory,
  updateCategory
} from "../../services/storefront";
import type {
  MerchantCatalog,
  MerchantCategory,
  MerchantProduct,
  MoveDirection
} from "../../types/storefront";
import type { Navigation, Notify } from "../routes";

type Props = {
  storefront: Storefront;
  focused: boolean;
  /** Increments when another screen asks to open the add-category sheet. */
  addCategoryRequest: number;
  nav: Navigation;
  notify: Notify;
};

type NameSheet =
  { mode: "create" } | { mode: "rename"; category: MerchantCategory };

/** Thực đơn: categories in order, each with its products and availability. */
export function CatalogScreen({
  storefront,
  focused,
  addCategoryRequest,
  nav,
  notify
}: Props) {
  const { top } = useSafeAreaInsets();
  const { catalog, catalogPhase, loadCatalog, mutateCatalog, setAvailability } =
    storefront;
  const [nameSheet, setNameSheet] = useState<NameSheet | null>(null);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState("");
  const [actionsFor, setActionsFor] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<CategoryAction | null>(
    null
  );
  const [actionError, setActionError] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [refreshing, setRefreshing] = useState(false);
  const firstFocus = useRef(true);

  useEffect(() => {
    if (!focused) return;
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    void loadCatalog();
  }, [focused, loadCatalog]);

  useEffect(() => {
    if (addCategoryRequest > 0) {
      setNameError("");
      setNameSheet({ mode: "create" });
    }
  }, [addCategoryRequest]);

  const categories = useMemo(() => catalog?.categories ?? [], [catalog]);
  const sections = useMemo(
    () => categories.map((category) => ({ category, data: category.products })),
    [categories]
  );
  const actionIndex = categories.findIndex((item) => item.id === actionsFor);
  const actionCategory = categories[actionIndex] ?? null;
  const productCount = categories.reduce(
    (sum, item) => sum + item.products.length,
    0
  );

  const refresh = async () => {
    setRefreshing(true);
    await storefront.refreshAll();
    setRefreshing(false);
  };

  const toggle = useCallback(
    async (product: MerchantProduct, value: boolean) => {
      setSavingIds((current) => new Set(current).add(product.id));
      const result = await setAvailability(product, value);
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(product.id);
        return next;
      });
      if (!result.ok)
        notify(
          `Chưa đổi được trạng thái “${product.name}”. ${result.message}`,
          "danger"
        );
    },
    [setAvailability, notify]
  );

  const openProduct = useCallback(
    (product: MerchantProduct) => nav.openProduct(product.id),
    [nav]
  );

  const submitName = async (name: string) => {
    if (!nameSheet) return;
    setNameBusy(true);
    setNameError("");
    const result = await mutateCatalog(() =>
      nameSheet.mode === "create"
        ? createCategory(name)
        : updateCategory(nameSheet.category.id, { name })
    );
    setNameBusy(false);
    if (!result.ok) return setNameError(result.message);
    notify(
      nameSheet.mode === "create"
        ? `Đã tạo danh mục “${name}”.`
        : `Đã đổi tên thành “${name}”.`
    );
    setNameSheet(null);
  };

  const runAction = async (
    action: CategoryAction,
    task: () => Promise<MerchantCatalog>,
    done: string,
    close: boolean
  ) => {
    setPendingAction(action);
    setActionError("");
    const result = await mutateCatalog(task);
    setPendingAction(null);
    if (!result.ok) return setActionError(result.message);
    if (close) setActionsFor(null);
    notify(done);
  };

  const closeActions = () => {
    setActionsFor(null);
    setActionError("");
  };

  const header = (
    <View style={[styles.header, { paddingTop: top + spacing.xs }]}>
      <View style={styles.headerText}>
        <Text style={styles.title} accessibilityRole="header">
          Thực đơn
        </Text>
        {catalog ? (
          <Text style={styles.subtitle}>
            {categories.length} danh mục · {productCount} món
          </Text>
        ) : null}
      </View>
      {categories.length ? (
        <Button
          label="Thêm danh mục"
          variant="tertiary"
          onPress={() => {
            setNameError("");
            setNameSheet({ mode: "create" });
          }}
        />
      ) : null}
    </View>
  );

  let body;
  if (!catalog && catalogPhase === "error")
    body = (
      <StatePanel
        title="Chưa tải được thực đơn"
        body={`${storefront.catalogError} Kiểm tra kết nối rồi thử lại.`}
      >
        <Button label="Thử lại" onPress={() => void loadCatalog()} />
      </StatePanel>
    );
  else if (!catalog) body = <CatalogSkeleton />;
  else if (!categories.length)
    body = (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Icon name="list" size={sizes.icon.large} color={colors.text.link} />
        </View>
        <StatePanel
          title="Thực đơn đang trống"
          body="Bắt đầu bằng một danh mục như “Món chính” hoặc “Đồ uống”, rồi thêm món vào đó."
        >
          <Button
            label="Tạo danh mục đầu tiên"
            onPress={() => {
              setNameError("");
              setNameSheet({ mode: "create" });
            }}
          />
        </StatePanel>
      </View>
    );
  else
    body = (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          catalogPhase === "ready" && storefront.catalogError ? (
            <View style={styles.listNotice}>
              <Notice
                tone="warning"
                message={`Chưa cập nhật được thực đơn mới nhất. ${storefront.catalogError}`}
              />
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <CategoryHeader
            category={section.category}
            onActions={(category) => {
              setActionError("");
              setActionsFor(category.id);
            }}
          />
        )}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            saving={savingIds.has(item.id)}
            onOpen={openProduct}
            onToggle={(product, value) => void toggle(product, value)}
          />
        )}
        ItemSeparatorComponent={Separator}
        renderSectionFooter={({ section }) =>
          section.data.length ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Thêm món vào ${section.category.name}`}
              onPress={() => nav.openProduct(undefined, section.category.id)}
              style={({ pressed }) => [
                styles.emptyRow,
                pressed && styles.pressed
              ]}
            >
              <Icon
                name="plus"
                size={sizes.icon.standard}
                color={colors.text.link}
              />
              <Text style={styles.emptyRowText}>
                Chưa có món. Thêm món vào danh mục này
              </Text>
            </Pressable>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            colors={[colors.brand.primary]}
            tintColor={colors.brand.primary}
          />
        }
      />
    );

  return (
    <View style={styles.screen}>
      {focused ? <StatusBar style="dark" /> : null}
      {header}
      <View style={styles.flex}>{body}</View>

      {categories.length ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thêm món"
          onPress={() => nav.openProduct()}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Icon name="plus" color={colors.text.inverse} />
          <Text style={styles.fabLabel}>Thêm món</Text>
        </Pressable>
      ) : null}

      <CategoryNameSheet
        visible={nameSheet !== null}
        initialName={
          nameSheet?.mode === "rename" ? nameSheet.category.name : undefined
        }
        busy={nameBusy}
        error={nameError}
        onCancel={() => setNameSheet(null)}
        onSubmit={(name) => void submitName(name)}
      />
      <CategoryActionsSheet
        category={actionCategory}
        index={actionIndex}
        count={categories.length}
        pending={pendingAction}
        error={actionError}
        onClose={closeActions}
        onRename={() => {
          if (!actionCategory) return;
          closeActions();
          setNameError("");
          setNameSheet({ mode: "rename", category: actionCategory });
        }}
        onToggleVisible={() => {
          if (!actionCategory) return;
          const show = !actionCategory.isActive;
          void runAction(
            "visibility",
            () => updateCategory(actionCategory.id, { isActive: show }),
            show
              ? `Khách đã thấy lại “${actionCategory.name}”.`
              : `Đã ẩn “${actionCategory.name}” với khách.`,
            false
          );
        }}
        onMove={(direction: MoveDirection) => {
          if (!actionCategory) return;
          void runAction(
            direction,
            () => moveCategory(actionCategory.id, direction),
            `Đã chuyển “${actionCategory.name}” ${direction === "up" ? "lên" : "xuống"}.`,
            false
          );
        }}
        onDelete={() => {
          if (!actionCategory) return;
          void runAction(
            "delete",
            () => deleteCategory(actionCategory.id),
            `Đã xoá danh mục “${actionCategory.name}”.`,
            true
          );
        }}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  headerText: { flex: 1, gap: spacing.xxs },
  title: { ...typography.role.sectionTitle, color: colors.text.primary },
  subtitle: { ...typography.role.caption, color: colors.text.secondary },
  // Room under the last row so the floating button never hides a switch.
  list: { paddingBottom: sizes.control.prominent + spacing.xxl },
  listNotice: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  separator: {
    height: 1,
    marginLeft: spacing.md,
    backgroundColor: colors.border.subtle
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: sizes.control.prominent,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.primary
  },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  emptyRowText: { ...typography.role.label, color: colors.text.link, flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyIcon: {
    width: sizes.control.prominent,
    height: sizes.control.prominent,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primarySubtle
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: sizes.control.prominent,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    elevation: elevation.raised.level,
    boxShadow: elevation.raised.webShadow
  },
  fabPressed: { backgroundColor: colors.brand.primaryPressed },
  fabLabel: { ...typography.role.label, color: colors.text.inverse }
});
