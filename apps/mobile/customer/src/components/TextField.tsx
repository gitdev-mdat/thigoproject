import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps
} from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { FieldMessage } from "./FieldMessage";

type Props = Omit<TextInputProps, "style"> & {
  label: string;
  helper?: string;
  error?: string | undefined;
};

/** Labelled text input following the shared input rules. */
export function TextField({
  label,
  helper,
  error,
  multiline,
  ...input
}: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.text.disabled}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...input}
        onFocus={(event) => {
          setFocused(true);
          input.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          input.onBlur?.(event);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          error ? styles.invalid : null
        ]}
      />
      {error || helper ? <FieldMessage error={error} helper={helper} /> : null}
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
    color: colors.text.primary
  },
  multiline: { minHeight: 88, paddingTop: spacing.sm },
  focused: { borderColor: colors.border.focus, borderWidth: 2 },
  invalid: { borderColor: colors.status.danger, borderWidth: 2 }
});
