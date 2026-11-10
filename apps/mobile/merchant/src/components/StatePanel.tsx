import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@thigo/design-tokens";

type Props = { title: string; body: string; children?: ReactNode };

/** Centered explanation for an empty, failed or blocked state. */
export function StatePanel({ title, body, children }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.body}>{body}</Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl
  },
  title: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    textAlign: "center"
  },
  body: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    textAlign: "center"
  },
  actions: { alignSelf: "stretch", gap: spacing.xs, marginTop: spacing.sm }
});
