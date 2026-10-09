import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { IconButton } from "./IconButton";

const tones = {
  info: { background: colors.status.infoBackground, text: colors.status.info },
  success: {
    background: colors.status.successBackground,
    text: colors.status.success
  },
  warning: {
    background: colors.status.warningBackground,
    text: colors.status.warning
  },
  danger: {
    background: colors.status.dangerBackground,
    text: colors.status.danger
  }
} as const;

type Props = {
  message: string;
  tone?: keyof typeof tones;
  /** Shows a close action when the notice can be dismissed. */
  onDismiss?: () => void;
};

/** Non-field status, such as an expired session or an order that moved. */
export function Notice({ message, tone = "info", onDismiss }: Props) {
  return (
    <View
      style={[
        styles.notice,
        onDismiss && styles.dismissible,
        { backgroundColor: tones[tone].background }
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: tones[tone].text }]}>{message}</Text>
      {onDismiss ? (
        <IconButton icon="close" label="Ẩn thông báo" onPress={onDismiss} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radius.medium
  },
  dismissible: { paddingVertical: spacing.none, paddingRight: spacing.none },
  text: { ...typography.role.bodySecondary, flex: 1 }
});
