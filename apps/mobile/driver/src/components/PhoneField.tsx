import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { FieldMessage } from "./FieldMessage";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  error?: string | undefined;
  editable?: boolean;
};

export function PhoneField({
  value,
  onChangeText,
  onSubmit,
  error,
  editable = true
}: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Số điện thoại</Text>
      <TextInput
        accessibilityLabel="Số điện thoại"
        autoComplete="tel"
        textContentType="telephoneNumber"
        keyboardType="phone-pad"
        returnKeyType="send"
        maxLength={16}
        placeholder="0901 234 567"
        placeholderTextColor={colors.text.disabled}
        editable={editable}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          focused && styles.focused,
          error ? styles.invalid : null
        ]}
      />
      <FieldMessage
        error={error}
        helper="Mã xác thực 6 số sẽ được gửi đến số này."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.role.label, color: colors.text.primary },
  input: {
    minHeight: sizes.control.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.primary,
    ...typography.role.body,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  focused: { borderColor: colors.border.focus, borderWidth: 2 },
  invalid: { borderColor: colors.status.danger, borderWidth: 2 }
});
