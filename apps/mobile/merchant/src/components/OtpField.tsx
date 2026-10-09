import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

const LENGTH = 6;

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  error?: string | undefined;
  editable?: boolean;
};

/**
 * Six visible cells backed by one native input, so paste and SMS autofill
 * keep working while the digits stay easy to scan.
 */
export function OtpField({
  value,
  onChangeText,
  error,
  editable = true
}: Props) {
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, LENGTH - 1);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Mã xác thực</Text>
      <Pressable
        accessible={false}
        onPress={() => input.current?.focus()}
        style={styles.cells}
      >
        {Array.from({ length: LENGTH }, (_, index) => {
          const digit = value[index];
          return (
            <View
              key={index}
              style={[
                styles.cell,
                digit ? styles.filled : null,
                focused && index === active ? styles.active : null,
                error ? styles.invalid : null
              ]}
            >
              <Text style={styles.digit}>{digit ?? ""}</Text>
            </View>
          );
        })}
        <TextInput
          ref={input}
          accessibilityLabel="Mã xác thực 6 số"
          autoFocus
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          keyboardType="number-pad"
          maxLength={LENGTH}
          caretHidden
          editable={editable}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.hiddenInput}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.role.label, color: colors.text.primary },
  cells: { flexDirection: "row", gap: spacing.xs },
  cell: {
    flex: 1,
    maxWidth: sizes.control.input,
    height: sizes.control.prominent,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.medium,
    backgroundColor: colors.surface.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  filled: { backgroundColor: colors.surface.secondary },
  active: { borderColor: colors.border.focus, borderWidth: 2 },
  invalid: { borderColor: colors.status.danger },
  digit: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
    color: "transparent"
  }
});
