import { Platform, StyleSheet, Switch, View } from "react-native";
import { colors, sizes } from "@thigo/design-tokens";

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Accessible name, e.g. "Còn món Cơm tấm sườn". */
  label: string;
  disabled?: boolean;
};

/** Native switch in THIGO colours with a 48 dp target around it. */
export function Toggle({
  value,
  onValueChange,
  label,
  disabled = false
}: Props) {
  return (
    <View style={styles.target}>
      <Switch
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
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
  );
}

const styles = StyleSheet.create({
  target: {
    minWidth: sizes.touchTarget.recommended,
    minHeight: sizes.touchTarget.recommended,
    alignItems: "center",
    justifyContent: "center"
  }
});
