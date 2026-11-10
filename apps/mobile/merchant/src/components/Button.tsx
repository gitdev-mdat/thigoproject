import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

type Props = {
  label: string;
  onPress: () => void;
  /**
   * `danger` is a destructive alternative on a neutral surface (e.g. "Từ chối");
   * `destructive` is the filled confirmation of an irreversible action.
   */
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "destructive";
  prominent?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  prominent = false,
  loading = false,
  loadingLabel,
  disabled = false,
  style
}: Props) {
  const inactive = disabled || loading;
  const textColor =
    disabled && !loading
      ? colors.text.disabled
      : variant === "primary" || variant === "destructive"
        ? colors.text.inverse
        : variant === "secondary"
          ? colors.text.primary
          : variant === "danger"
            ? colors.status.danger
            : colors.text.link;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={loading ? (loadingLabel ?? label) : label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        prominent && styles.prominent,
        styles[variant],
        pressed && pressedStyles[variant],
        disabled && !loading && variant !== "tertiary" && styles.disabled,
        style
      ]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={textColor} /> : null}
        <Text style={[styles.label, { color: textColor }]} numberOfLines={2}>
          {loading ? (loadingLabel ?? label) : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.control.standard,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center"
  },
  prominent: { minHeight: sizes.control.prominent },
  primary: { backgroundColor: colors.brand.primary },
  secondary: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default
  },
  tertiary: { paddingHorizontal: spacing.sm },
  danger: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default
  },
  destructive: { backgroundColor: colors.action.destructive },
  disabled: {
    backgroundColor: colors.action.disabled,
    borderColor: colors.action.disabled
  },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  label: { ...typography.role.label, textAlign: "center" }
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.brand.primaryPressed },
  secondary: { backgroundColor: colors.action.secondaryPressed },
  tertiary: { backgroundColor: colors.action.secondaryPressed },
  danger: { backgroundColor: colors.status.dangerBackground },
  destructive: { backgroundColor: colors.action.destructivePressed }
});
