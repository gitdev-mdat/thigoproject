import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { raisedShadow } from "../../utils/layout";

type Props = { value: string; onChangeText: (value: string) => void };

export function SearchBar({ value, onChangeText }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.bar, raisedShadow, focused && styles.focused]}>
      <Text style={styles.icon} accessible={false}>
        🔍
      </Text>
      <TextInput
        accessibilityLabel="Tìm món ăn hoặc quán"
        placeholder="Tìm món ăn, quán, đồ uống…"
        placeholderTextColor={colors.text.disabled}
        returnKeyType="search"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xoá nội dung tìm kiếm"
          onPress={() => onChangeText("")}
          style={styles.clear}
        >
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: sizes.control.input,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.elevated
  },
  focused: { borderColor: colors.border.focus, borderWidth: 2 },
  icon: { fontSize: sizes.icon.standard - 2 },
  input: {
    flex: 1,
    minHeight: sizes.control.input,
    ...typography.role.body,
    color: colors.text.primary
  },
  clear: {
    width: sizes.touchTarget.recommended,
    height: sizes.touchTarget.recommended,
    alignItems: "center",
    justifyContent: "center"
  },
  clearText: { ...typography.role.label, color: colors.text.secondary }
});
