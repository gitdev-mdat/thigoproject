import { useState } from "react";
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
import { useAddresses } from "../../hooks/useAddresses";
import { ApiError } from "../../services/api";
import { ordersApi } from "../../services/orders";
import type { Address } from "../../types/orders";

const LABELS = ["Nhà", "Công ty"];

type Props = {
  selectedId: string | null;
  onBack: () => void;
  /** The chosen address becomes the default for future orders. */
  onSelected: (address: Address) => void;
};

export function AddressScreen({ selectedId, onBack, onSelected }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { status, addresses, reload, create } = useAddresses();
  const [adding, setAdding] = useState(false);
  const [labelChoice, setLabelChoice] = useState("Nhà");
  const [customLabel, setCustomLabel] = useState("");
  const [line, setLine] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const showForm = adding || (status === "ready" && addresses.length === 0);
  const label = labelChoice === "Khác" ? customLabel.trim() : labelChoice;

  const choose = async (address: Address) => {
    setBusy(true);
    setError(undefined);
    try {
      onSelected(
        address.isDefault ? address : await ordersApi.makeDefault(address.id)
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Chưa lưu được lựa chọn.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!label) return setError("Đặt tên cho địa chỉ, ví dụ “Nhà bạn”.");
    if (line.trim().length < 5)
      return setError("Nhập số nhà, tên đường và quận.");
    setBusy(true);
    setError(undefined);
    try {
      const address = await create({
        label,
        line: line.trim(),
        note: note.trim(),
        makeDefault: true
      });
      onSelected(address);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Chưa lưu được địa chỉ.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Địa chỉ giao hàng" onBack={onBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: bottom + spacing.xl }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {status === "loading" ? (
            <>
              <Placeholder height={72} />
              <Placeholder height={72} />
            </>
          ) : status === "error" ? (
            <View style={styles.notice}>
              <Text style={styles.help}>Chưa tải được địa chỉ đã lưu.</Text>
              <Button
                label="Thử lại"
                variant="secondary"
                onPress={() => void reload()}
              />
            </View>
          ) : (
            <View accessibilityRole="radiogroup" style={styles.list}>
              {addresses.map((address) => {
                const selected = address.id === selectedId;
                return (
                  <Pressable
                    key={address.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, disabled: busy }}
                    accessibilityLabel={`${address.label}, ${address.line}`}
                    disabled={busy}
                    onPress={() => void choose(address)}
                    style={({ pressed }) => [
                      styles.address,
                      selected && styles.addressOn,
                      pressed && styles.pressed
                    ]}
                  >
                    <Icon
                      name="pin"
                      color={
                        selected ? colors.brand.primary : colors.text.secondary
                      }
                    />
                    <View style={styles.flex}>
                      <Text style={styles.label}>{address.label}</Text>
                      <Text style={styles.line}>{address.line}</Text>
                      {address.note ? (
                        <Text style={styles.note}>Ghi chú: {address.note}</Text>
                      ) : null}
                    </View>
                    {selected ? (
                      <Icon name="check" color={colors.brand.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}

          {error && !showForm ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          {showForm ? (
            <View style={styles.form}>
              <Text style={styles.formTitle} accessibilityRole="header">
                Thêm địa chỉ mới
              </Text>
              <View style={styles.labels} accessibilityRole="radiogroup">
                {[...LABELS, "Khác"].map((item) => {
                  const on = item === labelChoice;
                  return (
                    <Pressable
                      key={item}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      onPress={() => setLabelChoice(item)}
                      style={[styles.labelChip, on && styles.labelChipOn]}
                    >
                      <Text
                        style={[styles.labelText, on && styles.labelTextOn]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {labelChoice === "Khác" ? (
                <TextField
                  label="Tên địa chỉ"
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  maxLength={40}
                  placeholder="Ví dụ: Nhà bố mẹ"
                />
              ) : null}
              <TextField
                label="Địa chỉ"
                value={line}
                onChangeText={(value) => {
                  setLine(value);
                  setError(undefined);
                }}
                maxLength={255}
                placeholder="Số nhà, tên đường, phường, quận"
                autoComplete="street-address"
              />
              <TextField
                label="Ghi chú cho tài xế (không bắt buộc)"
                value={note}
                onChangeText={setNote}
                maxLength={255}
                placeholder="Ví dụ: Gọi trước khi giao"
              />
              {error ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}
              <Button
                label="Lưu và giao đến đây"
                loadingLabel="Đang lưu…"
                loading={busy}
                onPress={() => void save()}
              />
            </View>
          ) : status === "ready" ? (
            <Button
              label="Thêm địa chỉ mới"
              variant="secondary"
              onPress={() => setAdding(true)}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  flex: { flex: 1 },
  scroll: { padding: spacing.md, gap: spacing.md },
  list: { gap: spacing.xs },
  address: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle
  },
  addressOn: {
    borderWidth: 2,
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySubtle
  },
  pressed: { backgroundColor: colors.surface.secondary },
  label: { ...typography.role.label, color: colors.text.primary },
  line: { ...typography.role.body, color: colors.text.primary },
  note: { ...typography.role.caption, color: colors.text.secondary },
  notice: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    backgroundColor: colors.surface.secondary
  },
  help: { ...typography.role.body, color: colors.text.secondary },
  form: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle
  },
  formTitle: { ...typography.role.sectionTitle, color: colors.text.primary },
  labels: { flexDirection: "row", gap: spacing.xs },
  labelChip: {
    minHeight: sizes.touchTarget.recommended,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default
  },
  labelChipOn: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySubtle
  },
  labelText: { ...typography.role.label, color: colors.text.primary },
  labelTextOn: { color: colors.text.link },
  error: { ...typography.role.bodySecondary, color: colors.status.danger }
});
