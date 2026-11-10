import { StyleSheet, Text } from "react-native";
import { colors, typography } from "@thigo/design-tokens";

type Props = { error?: string | undefined; helper?: string | undefined };

/** Reserves one line under a field so errors don't push the CTA around. */
export function FieldMessage({ error, helper }: Props) {
  if (error)
    return (
      <Text accessibilityRole="alert" style={[styles.text, styles.error]}>
        {error}
      </Text>
    );
  return <Text style={styles.text}>{helper ?? " "}</Text>;
}

const styles = StyleSheet.create({
  text: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    minHeight: typography.role.bodySecondary.lineHeight
  },
  error: { color: colors.status.danger }
});
