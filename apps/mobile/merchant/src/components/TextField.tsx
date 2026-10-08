import { forwardRef, useState } from "react";
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
  helper?: string | undefined;
  error?: string | undefined;
  /** Text shown inside the field after the value, e.g. "₫". */
  suffix?: string | undefined;
};

/** Labelled text input following the shared input rules. */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, helper, error, suffix, multiline, ...input },
  ref
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.box,
          multiline && styles.multiline,
          focused && styles.focused,
          error ? styles.invalid : null
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? helper}
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
          style={[styles.input, multiline && styles.multilineInput]}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {error || helper ? <FieldMessage error={error} helper={helper} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.role.label, color: colors.text.primary },
  box: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: sizes.control.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.primary
  },
  input: {
    flex: 1,
    alignSelf: "stretch",
    paddingVertical: spacing.xs,
    ...typography.role.body,
    color: colors.text.primary
  },
  multiline: { alignItems: "stretch" },
  multilineInput: {
    minHeight: sizes.control.input * 2,
    paddingTop: spacing.sm
  },
  suffix: { ...typography.role.body, color: colors.text.secondary },
  // Border grows from 1 to 2, so padding shrinks by 1 to keep text still.
  focused: {
    borderColor: colors.border.focus,
    borderWidth: 2,
    paddingHorizontal: spacing.md - 1
  },
  invalid: {
    borderColor: colors.status.danger,
    borderWidth: 2,
    paddingHorizontal: spacing.md - 1
  }
});
