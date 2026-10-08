import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

type Props = { message: string };

/** Non-field status, such as an expired session, shown above a form. */
export function Notice({ message }: Props) {
  return (
    <View style={styles.notice} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    padding: spacing.sm,
    borderRadius: radius.medium,
    backgroundColor: colors.status.infoBackground
  },
  text: { ...typography.role.bodySecondary, color: colors.status.info }
});
