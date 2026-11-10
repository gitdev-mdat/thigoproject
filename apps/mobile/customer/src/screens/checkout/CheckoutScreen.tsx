import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
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
import { ScreenHeader } from "../../components/ScreenHeader";
import { TextField } from "../../components/TextField";
import { Placeholder } from "../../components/home/Placeholder";
import { ApiError } from "../../services/api";
import { ordersApi } from "../../services/orders";
import { useCart } from "../../stores/cart";
import type { Address, OrderDetail, Quote } from "../../types/orders";
import { formatVnd } from "../../utils/format";
import { createIdempotencyKey } from "../../utils/idempotency";

type Props = {
  address: Address | null;
  onChangeAddress: () => void;
  onBack: () => void;
  onPlaced: (order: OrderDetail) => void;
};

export function CheckoutScreen({
  address,
  onChangeAddress,
  onBack,
  onPlaced
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { cart, dispatch } = useCart();
  const [quote, setQuote] = useState<Quote>();
  const [quoteStatus, setQuoteStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [problem, setProblem] = useState<string>();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const items = useMemo(
    () =>
      cart.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        optionIds: line.options.map((option) => option.id)
      })),
    [cart.lines]
  );
  // One key per cart: retries after a timeout reuse it, so the server returns the same order.
  const idempotency = useRef({ items, key: createIdempotencyKey() });
  if (idempotency.current.items !== items)
    idempotency.current = { items, key: createIdempotencyKey() };

  const loadQuote = useCallback(async () => {
    if (!cart.storeId || !items.length) return;
    setQuoteStatus("loading");
    setProblem(undefined);
    try {
      setQuote(await ordersApi.quote(cart.storeId, items));
      setQuoteStatus("ready");
    } catch (error) {
      setQuoteStatus("error");
      setProblem(
        error instanceof ApiError && error.status !== "network"
          ? error.message
          : "Chưa tính được tổng tiền. Kiểm tra kết nối rồi thử lại."
      );
    }
  }, [cart.storeId, items]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const submit = async () => {
    if (!cart.storeId || !address || submitting) return;
    setSubmitting(true);
    setProblem(undefined);
    try {
      const order = await ordersApi.place({
        idempotencyKey: idempotency.current.key,
        storeId: cart.storeId,
        addressId: address.id,
        note: note.trim(),
        paymentMethod: "COD",
        items
      });
      dispatch({ type: "clear" });
      onPlaced(order);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setProblem(error.message);
        void loadQuote();
      } else
        setProblem(
          error instanceof ApiError && error.status !== "network"
            ? error.message
            : "Chưa gửi được đơn. Bấm đặt lại, đơn sẽ không bị tạo trùng."
        );
    } finally {
      setSubmitting(false);
    }
  };

  const ready = quoteStatus === "ready" && quote && address;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Xác nhận đơn hàng"
        subtitle={cart.storeName}
        onBack={onBack}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Section title="Giao đến">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                address
                  ? `Giao đến ${address.label}, ${address.line}. Đổi địa chỉ`
                  : "Chọn địa chỉ giao hàng"
              }
              onPress={onChangeAddress}
              style={({ pressed }) => [
                styles.address,
                !address && styles.addressMissing,
                pressed && styles.pressed
              ]}
            >
              <Icon name="pin" color={colors.brand.primary} />
              <View style={styles.flex}>
                {address ? (
                  <>
                    <Text style={styles.label}>{address.label}</Text>
                    <Text style={styles.body}>{address.line}</Text>
                    {address.note ? (
                      <Text style={styles.caption}>
                        Ghi chú: {address.note}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.label}>Chọn địa chỉ giao hàng</Text>
                )}
              </View>
              <Text style={styles.link}>{address ? "Đổi" : "Chọn"}</Text>
            </Pressable>
          </Section>

          <Section title="Món đã chọn">
            {quoteStatus === "loading" && !quote ? (
              <>
                <Placeholder height={44} />
                <Placeholder height={44} />
              </>
            ) : (
              (quote?.lines ?? []).map((line, index) => (
                <View key={`${line.productId}-${index}`} style={styles.line}>
                  <Text style={styles.qty}>{line.quantity}×</Text>
                  <View style={styles.flex}>
                    <Text style={styles.body}>{line.name}</Text>
                    {line.options.length ? (
                      <Text style={styles.caption}>
                        {line.options.map((option) => option.name).join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.money}>
                    {formatVnd(line.lineTotalVnd)}
                  </Text>
                </View>
              ))
            )}
          </Section>

          <TextField
            label="Ghi chú cho quán (không bắt buộc)"
            value={note}
            onChangeText={setNote}
            maxLength={500}
            multiline
            placeholder="Ví dụ: Ít cay, không hành"
          />

          <Section title="Thanh toán">
            <View style={[styles.address, styles.payment]} accessible>
              <View style={styles.radioOn}>
                <View style={styles.dot} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>Tiền mặt khi nhận hàng</Text>
                <Text style={styles.caption}>Trả cho tài xế khi nhận món.</Text>
              </View>
            </View>
          </Section>

          {quote ? (
            <View style={styles.totals}>
              <Row label="Tạm tính" value={formatVnd(quote.subtotalVnd)} />
              <Row
                label="Phí giao hàng"
                value={formatVnd(quote.deliveryFeeVnd)}
              />
              <View style={styles.divider} />
              <Row label="Tổng cộng" value={formatVnd(quote.totalVnd)} strong />
            </View>
          ) : null}

          {problem ? (
            <View style={styles.problem} accessibilityRole="alert">
              <Text style={styles.problemText}>{problem}</Text>
              {quoteStatus === "error" ? (
                <View style={styles.problemActions}>
                  <Button
                    label="Thử lại"
                    variant="secondary"
                    onPress={() => void loadQuote()}
                  />
                  <Button
                    label="Sửa giỏ hàng"
                    variant="tertiary"
                    onPress={onBack}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <View
        style={[styles.footer, { paddingBottom: Math.max(bottom, spacing.sm) }]}
      >
        {!address ? (
          <Text style={styles.caption}>Chọn địa chỉ để đặt đơn.</Text>
        ) : null}
        <Button
          label={quote ? `Đặt đơn · ${formatVnd(quote.totalVnd)}` : "Đặt đơn"}
          loadingLabel="Đang gửi đơn…"
          prominent
          loading={submitting}
          disabled={!ready}
          onPress={() => void submit()}
        />
      </View>
    </View>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.totalLabel : styles.body}>{label}</Text>
      <Text style={strong ? styles.totalValue : styles.money}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  flex: { flex: 1 },
  scroll: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.role.itemTitle, color: colors.text.primary },
  address: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle
  },
  addressMissing: { borderColor: colors.status.warning, borderWidth: 2 },
  payment: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySubtle
  },
  pressed: { backgroundColor: colors.surface.secondary },
  label: { ...typography.role.label, color: colors.text.primary },
  body: { ...typography.role.body, color: colors.text.primary },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  link: {
    ...typography.role.label,
    color: colors.text.link,
    minWidth: 40,
    textAlign: "right"
  },
  line: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle
  },
  qty: { ...typography.role.label, color: colors.text.secondary, minWidth: 28 },
  money: {
    ...typography.role.body,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  radioOn: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.text.inverse
  },
  totals: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.large,
    backgroundColor: colors.surface.secondary
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.xxs
  },
  totalLabel: { ...typography.role.itemTitle, color: colors.text.primary },
  totalValue: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  problem: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.status.dangerBackground
  },
  problemText: { ...typography.role.label, color: colors.status.danger },
  problemActions: { flexDirection: "row", gap: spacing.xs },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
    minHeight: sizes.control.prominent
  }
});
