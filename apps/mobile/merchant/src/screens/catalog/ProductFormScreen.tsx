import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ConfirmSheet } from "../../components/ConfirmSheet";
import { DiscardChangesSheet } from "../../components/DiscardChangesSheet";
import { FieldMessage } from "../../components/FieldMessage";
import { Notice } from "../../components/Notice";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SelectChip } from "../../components/SelectChip";
import { StatePanel } from "../../components/StatePanel";
import { TextField } from "../../components/TextField";
import { ToggleRow } from "../../components/ToggleRow";
import { ImagePickerCard } from "../../components/media/ImagePickerCard";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useLeaveGuard } from "../../hooks/useLeaveGuard";
import type { Storefront } from "../../hooks/useStorefront";
import { moveProduct } from "../../services/storefront";
import type {
  MerchantProduct,
  MoveDirection,
  ProductInput,
  ProductUpdateInput
} from "../../types/storefront";
import { isDirty } from "../../utils/dirty";
import { formatPriceInput, parsePrice, priceError } from "../../utils/price";
import { findProduct, productPosition } from "../../utils/storefront";
import type { Navigation, Notify } from "../routes";
import { useKeyboardVisible } from "../../hooks/useKeyboardVisible";

const PRODUCT_ASPECT: [number, number] = [4, 3];
const DESCRIPTION_MAX = 500;

type Props = {
  /** Edit this product; create a new one when absent. */
  productId?: string | undefined;
  initialCategoryId?: string | undefined;
  storefront: Storefront;
  nav: Navigation;
  notify: Notify;
};

/** Create or edit one product; the Save action stays pinned above the keyboard. */
export function ProductFormScreen({
  productId,
  initialCategoryId,
  storefront,
  nav,
  notify
}: Props) {
  const found = findProduct(storefront.catalog, productId ?? "");
  // Keep the last known product so a delete can pop without a "not found" flash.
  const lastFound = useRef(found);
  if (found) lastFound.current = found;
  const product = found ?? lastFound.current;
  const editing = productId !== undefined;
  const title = editing ? "Sửa món" : "Thêm món";

  if (!storefront.catalog)
    return (
      <View style={styles.screen}>
        <ScreenHeader title={title} onBack={nav.back} />
        {storefront.catalogPhase === "error" ? (
          <StatePanel
            title="Chưa tải được thực đơn"
            body={`${storefront.catalogError} Kiểm tra kết nối rồi thử lại.`}
          >
            <Button
              label="Thử lại"
              onPress={() => void storefront.loadCatalog()}
            />
          </StatePanel>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator
              color={colors.brand.primary}
              accessibilityLabel="Đang tải thực đơn"
            />
          </View>
        )}
      </View>
    );

  if (editing && !product)
    return (
      <View style={styles.screen}>
        <ScreenHeader title={title} onBack={nav.back} />
        <StatePanel
          title="Không tìm thấy món này"
          body="Món có thể đã bị xoá hoặc chuyển khỏi thực đơn."
        >
          <Button label="Quay lại thực đơn" onPress={nav.back} />
        </StatePanel>
      </View>
    );
  return (
    <ProductForm
      product={product}
      initialCategoryId={initialCategoryId}
      storefront={storefront}
      nav={nav}
      notify={notify}
      title={title}
    />
  );
}

type FormErrors = Partial<
  Record<"name" | "category" | "price" | "description", string>
>;

function ProductForm({
  product,
  initialCategoryId,
  storefront,
  nav,
  notify,
  title
}: {
  product: MerchantProduct | undefined;
  initialCategoryId: string | undefined;
  storefront: Storefront;
  nav: Navigation;
  notify: Notify;
  title: string;
}) {
  const { bottom } = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const categories = storefront.catalog?.categories ?? [];
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? initialCategoryId ?? categories[0]?.id ?? ""
  );
  const [price, setPrice] = useState<number | null>(product?.priceVnd ?? null);
  const [description, setDescription] = useState(product?.description ?? "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [imageUrl, setImageUrl] = useState<string | null>(
    product?.imageUrl ?? null
  );
  /** undefined: unchanged; null: remove; string: attach this upload. */
  const [imageMediaId, setImageMediaId] = useState<string | null>();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [moving, setMoving] = useState<MoveDirection | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const upload = useImageUpload(PRODUCT_ASPECT);
  const draft = { name, categoryId, price, description, isAvailable };
  const [initial] = useState(() => draft);
  const guard = useLeaveGuard({
    // An image still uploading counts as an unsaved change.
    dirty:
      isDirty(initial, draft) ||
      imageMediaId !== undefined ||
      upload.status === "uploading",
    busy: saving || deleting,
    nav
  });

  const position = product
    ? productPosition(storefront.catalog, product.id)
    : undefined;
  const uploading =
    upload.status === "uploading" || upload.status === "picking";
  const busy = saving || deleting || moving !== null;

  const validate = (): FormErrors => {
    const found: FormErrors = {};
    const trimmed = name.trim();
    if (trimmed.length < 2) found.name = "Tên món cần ít nhất 2 ký tự.";
    else if (trimmed.length > 120) found.name = "Tên món tối đa 120 ký tự.";
    if (!categories.some((item) => item.id === categoryId))
      found.category = "Chọn danh mục cho món.";
    const priceProblem = priceError(price);
    if (priceProblem) found.price = priceProblem;
    if (description.trim().length > DESCRIPTION_MAX)
      found.description = `Mô tả tối đa ${DESCRIPTION_MAX} ký tự.`;
    return found;
  };

  // Errors appear after the first save attempt, then follow the owner's fixes.
  const errors: FormErrors = submitted ? validate() : {};
  const touch = () => setServerError("");

  const pickImage = async () => {
    const picked = await upload.pickAndUpload();
    if (!picked) return;
    setImageUrl(picked.media.url);
    setImageMediaId(picked.media.id);
  };

  const removeImage = () => {
    upload.clear();
    setImageUrl(null);
    setImageMediaId(product?.imageUrl ? null : undefined);
  };

  const body = (): ProductInput | ProductUpdateInput => {
    const trimmedDescription = description.trim();
    if (!product)
      return {
        name: name.trim(),
        categoryId,
        priceVnd: price ?? 0,
        isAvailable,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        ...(imageMediaId ? { imageMediaId } : {})
      };
    const changes: ProductUpdateInput = {};
    if (name.trim() !== product.name) changes.name = name.trim();
    if (categoryId !== product.categoryId) changes.categoryId = categoryId;
    if (price !== product.priceVnd) changes.priceVnd = price ?? 0;
    if (isAvailable !== product.isAvailable) changes.isAvailable = isAvailable;
    if ((trimmedDescription || null) !== (product.description ?? null))
      changes.description = trimmedDescription || null;
    if (imageMediaId !== undefined) changes.imageMediaId = imageMediaId;
    return changes;
  };

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(validate()).length) return;
    const input = body();
    if (product && !Object.keys(input).length) {
      notify("Không có thay đổi nào để lưu.", "info");
      return guard.leave();
    }
    setSaving(true);
    setServerError("");
    const result = await storefront.saveProduct(product?.id, input);
    setSaving(false);
    if (!result.ok) return setServerError(result.message);
    notify(
      product
        ? `Đã lưu thay đổi cho “${result.value.name}”.`
        : `Đã thêm “${result.value.name}” vào thực đơn.`
    );
    guard.leave();
  };

  const move = async (direction: MoveDirection) => {
    if (!product) return;
    setMoving(direction);
    const result = await storefront.mutateCatalog(() =>
      moveProduct(product.id, direction)
    );
    setMoving(null);
    if (!result.ok) return notify(result.message, "danger");
    notify(
      `Đã chuyển “${product.name}” ${direction === "up" ? "lên" : "xuống"}.`
    );
  };

  const remove = async () => {
    if (!product) return;
    setDeleting(true);
    setDeleteError("");
    const result = await storefront.removeProduct(product.id);
    setDeleting(false);
    if (!result.ok) return setDeleteError(result.message);
    setConfirmDelete(false);
    notify(
      result.value.outcome === "archived"
        ? `Đã gỡ “${product.name}” khỏi thực đơn. Món vẫn được giữ trong lịch sử đơn hàng.`
        : `Đã xoá “${product.name}”.`
    );
    guard.leave();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={title}
        subtitle={product?.name}
        onBack={nav.back}
        backDisabled={saving || deleting}
      />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!categories.length ? (
            <Notice
              tone="warning"
              message="Chưa có danh mục nào. Hãy tạo danh mục trong Thực đơn trước khi thêm món."
            />
          ) : null}

          <ImagePickerCard
            label="Ảnh món (không bắt buộc)"
            noun="ảnh"
            imageUrl={upload.previewUri ?? imageUrl}
            aspectRatio={PRODUCT_ASPECT[0] / PRODUCT_ASPECT[1]}
            status={upload.status}
            error={upload.error}
            disabled={busy}
            onPick={() => void pickImage()}
            onRemove={removeImage}
          />

          <TextField
            label="Tên món"
            placeholder="Ví dụ: Cơm tấm sườn bì chả"
            value={name}
            onChangeText={(value) => {
              setName(value);
              touch();
            }}
            maxLength={120}
            autoCapitalize="sentences"
            editable={!saving}
            error={errors.name}
          />

          <View style={styles.group} accessibilityRole="radiogroup">
            <Text style={styles.label}>Danh mục</Text>
            <View style={styles.chips}>
              {categories.map((category) => (
                <SelectChip
                  key={category.id}
                  label={category.name}
                  hint={category.isActive ? undefined : "đang ẩn"}
                  selected={category.id === categoryId}
                  disabled={saving}
                  onPress={() => {
                    setCategoryId(category.id);
                    touch();
                  }}
                />
              ))}
            </View>
            {errors.category ? <FieldMessage error={errors.category} /> : null}
          </View>

          <TextField
            label="Giá bán"
            placeholder="35.000"
            suffix="₫"
            keyboardType="number-pad"
            value={formatPriceInput(price)}
            onChangeText={(value) => {
              setPrice(parsePrice(value));
              touch();
            }}
            editable={!saving}
            error={errors.price}
            helper="Từ 1.000 ₫ đến 10.000.000 ₫."
          />

          <TextField
            label="Mô tả (không bắt buộc)"
            placeholder="Thành phần, khẩu phần, cách dùng…"
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              touch();
            }}
            multiline
            maxLength={DESCRIPTION_MAX}
            editable={!saving}
            error={errors.description}
            helper={`${description.length}/${DESCRIPTION_MAX} ký tự`}
          />

          <ToggleRow
            title="Đang bán"
            description={
              isAvailable
                ? "Khách đặt được món này."
                : "Món hiện “Tạm hết”, khách chưa đặt được."
            }
            value={isAvailable}
            disabled={saving}
            onChange={setIsAvailable}
          />

          {product && product.optionGroupCount > 0 ? (
            <Notice
              tone="info"
              message={`Món có ${product.optionGroupCount} tuỳ chọn (kích cỡ, topping). Tuỳ chọn chưa chỉnh được trong ứng dụng; liên hệ THIGO nếu cần thay đổi.`}
            />
          ) : null}

          {product && position ? (
            <Card title="Sắp xếp và xoá">
              <View style={styles.row}>
                <Button
                  label="Chuyển lên"
                  loadingLabel="Đang chuyển…"
                  variant="secondary"
                  loading={moving === "up"}
                  disabled={busy || position.index === 0}
                  onPress={() => void move("up")}
                  style={styles.half}
                />
                <Button
                  label="Chuyển xuống"
                  loadingLabel="Đang chuyển…"
                  variant="secondary"
                  loading={moving === "down"}
                  disabled={busy || position.index >= position.count - 1}
                  onPress={() => void move("down")}
                  style={styles.half}
                />
              </View>
              <Text style={styles.help}>
                Vị trí {position.index + 1}/{position.count} trong danh mục.
              </Text>
              <Button
                label="Xoá món"
                variant="danger"
                disabled={busy}
                onPress={() => {
                  setDeleteError("");
                  setConfirmDelete(true);
                }}
              />
            </Card>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: (keyboardVisible ? 0 : bottom) + spacing.sm }
          ]}
        >
          {serverError ? <Notice message={serverError} tone="danger" /> : null}
          <Button
            label={product ? "Lưu thay đổi" : "Thêm món"}
            loadingLabel="Đang lưu…"
            prominent
            loading={saving}
            disabled={uploading || deleting || !categories.length}
            onPress={() => void save()}
          />
          {uploading ? (
            <Text style={styles.help}>Chờ ảnh tải lên xong để lưu.</Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={confirmDelete}
        title={`Xoá “${product?.name ?? ""}”?`}
        body="Nếu món đã có trong đơn hàng trước đây, món sẽ được lưu trữ: gỡ khỏi thực đơn nhưng vẫn giữ trong lịch sử đơn. Nếu chưa từng được đặt, món sẽ bị xoá hẳn."
        confirmLabel="Xoá món"
        loadingLabel="Đang xoá…"
        cancelLabel="Giữ món"
        destructive
        busy={deleting}
        error={deleteError}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
      <DiscardChangesSheet
        visible={guard.confirming}
        onStay={guard.stay}
        onDiscard={guard.leave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  group: { gap: spacing.xs },
  label: { ...typography.role.label, color: colors.text.primary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  half: { flexGrow: 1, flexBasis: 140 },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  }
});
