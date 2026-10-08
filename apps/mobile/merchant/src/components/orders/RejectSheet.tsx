import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import type { MerchantOrder } from "../../types/orders";
import { REJECT_PRESETS, normalizeRejectReason } from "../../utils/board";
import { Button } from "../Button";
import { FieldMessage } from "../FieldMessage";
import { Sheet } from "../Sheet";

const OTHER = "other";

type Props = {
  order: MerchantOrder | null;
  busy: boolean;
  /** Inline error from the last attempt (e.g. no connection). */
  error: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

/** Asks why before rejecting, and names the consequence on the confirm. */
export function RejectSheet({
  order,
  busy,
  error,
  onCancel,
  onConfirm
}: Props) {
  const [choice, setChoice] = useState<string>();
  const [other, setOther] = useState("");
  const [focused, setFocused] = useState(false);

  // Each order starts from a clean choice.
  const orderId = order?.id;
  useEffect(() => {
    setChoice(undefined);
    setOther("");
  }, [orderId]);

  const reason =
    choice === OTHER ? normalizeRejectReason(other) : choice ? choice : null;
  const otherTooShort = choice === OTHER && other.trim().length > 0 && !reason;

  return (
    <Sheet
      visible={order !== null}
      title={order ? `Từ chối đơn #${order.code}?` : "Từ chối đơn"}
      onClose={onCancel}
      locked={busy}
      footer={
        <>
          <Button
            label="Giữ đơn"
            variant="secondary"
            disabled={busy}
            onPress={onCancel}
            style={styles.action}
          />
          <Button
            label="Từ chối đơn"
            loadingLabel="Đang từ chối…"
            variant="destructive"
            loading={busy}
            disabled={!reason}
            onPress={() => reason && onConfirm(reason)}
            style={styles.action}
          />
        </>
      }
    >
      <Text style={styles.body}>
        Khách sẽ được báo đơn bị từ chối kèm lý do và không phải trả tiền. Không
        thể hoàn tác.
      </Text>
      <Text style={styles.label}>Lý do từ chối</Text>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {[...REJECT_PRESETS, OTHER].map((value) => {
          const selected = choice === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: busy }}
              disabled={busy}
              onPress={() => setChoice(value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed
              ]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={styles.optionText}>
                {value === OTHER ? "Lý do khác" : value}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {choice === OTHER ? (
        <View style={styles.field}>
          <Text style={styles.label}>Nhập lý do</Text>
          <TextInput
            accessibilityLabel="Nhập lý do từ chối"
            placeholder="Ví dụ: Hết nguyên liệu làm nước chấm"
            placeholderTextColor={colors.text.disabled}
            value={other}
            onChangeText={setOther}
            maxLength={255}
            editable={!busy}
            autoFocus
            multiline
            textAlignVertical="top"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, focused && styles.inputFocused]}
          />
          <FieldMessage
            error={otherTooShort ? "Lý do cần ít nhất 3 ký tự." : undefined}
            helper="Khách sẽ thấy lý do này."
          />
        </View>
      ) : null}
      {error ? <FieldMessage error={error} /> : null}
    </Sheet>
  );
}

const RADIO = sizes.icon.large;

const styles = StyleSheet.create({
  body: { ...typography.role.body, color: colors.text.primary },
  label: {
    ...typography.role.label,
    color: colors.text.primary,
    marginTop: spacing.xs
  },
  options: { gap: spacing.xs },
  option: {
    minHeight: sizes.touchTarget.recommended,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle
  },
  optionSelected: {
    borderColor: colors.border.focus,
    backgroundColor: colors.brand.primarySubtle
  },
  optionPressed: { backgroundColor: colors.action.secondaryPressed },
  radio: {
    width: RADIO,
    height: RADIO,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center"
  },
  radioSelected: { borderColor: colors.brand.primary },
  radioDot: {
    width: RADIO / 2,
    height: RADIO / 2,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary
  },
  optionText: { ...typography.role.body, color: colors.text.primary, flex: 1 },
  field: { gap: spacing.xs },
  input: {
    minHeight: sizes.control.input * 1.5,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface.primary,
    ...typography.role.body,
    color: colors.text.primary
  },
  inputFocused: { borderColor: colors.border.focus, borderWidth: 2 },
  action: { flex: 1 }
});
