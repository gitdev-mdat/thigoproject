import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

const tones = {
  info: { background: colors.status.infoBackground, text: colors.status.info },
  warning: {
    background: colors.status.warningBackground,
    text: colors.status.warning
  }
} as const;

type Props = { message: string; tone?: keyof typeof tones };

/** Non-field status, such as an expired session or a lost claim. */
export function Notice({ message, tone = "info" }: Props) {
  return (
    <View
      style={[styles.notice, { backgroundColor: tones[tone].background }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: tones[tone].text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { padding: spacing.sm, borderRadius: radius.medium },
  text: typography.role.bodySecondary
});
