import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { colors, sizes, spacing, typography } from "@thigo/design-tokens";

type Props = {
  title: string;
  description?: string | undefined;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  /** Prominent rows use the item title and a taller target. */
  prominent?: boolean;
};

/** A labelled switch where the whole row is one tap target. */
export function ToggleRow({
  title,
  description,
  value,
  onChange,
  disabled = false,
  prominent = false
}: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [
        styles.row,
        prominent && styles.prominent,
        pressed && styles.pressed
      ]}
    >
      <View style={styles.text}>
        <Text
          style={[
            prominent ? styles.titleProminent : styles.title,
            disabled && styles.disabled
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {/* Visual only: the row owns the press and the accessibility state. */}
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
      >
        <Switch
          value={value}
          disabled={disabled}
          trackColor={{
            false: colors.border.default,
            true: colors.brand.primary
          }}
          thumbColor={
            Platform.OS === "android" ? colors.surface.primary : undefined
          }
          ios_backgroundColor={colors.border.default}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: sizes.touchTarget.recommended,
    paddingVertical: spacing.xs
  },
  prominent: { minHeight: sizes.control.prominent },
  pressed: { opacity: 0.85 },
  text: { flex: 1, gap: spacing.xxs },
  title: { ...typography.role.label, color: colors.text.primary },
  titleProminent: { ...typography.role.itemTitle, color: colors.text.primary },
  disabled: { color: colors.text.disabled },
  description: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary
  }
});
