import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

type Props = {
  title?: string | undefined;
  /** Supporting line under the title. */
  subtitle?: string | undefined;
  /** Trailing control in the title row, e.g. a tertiary button. */
  action?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Bordered group for one coherent object or decision. */
export function Card({ title, subtitle, action, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.head}>
          <View style={styles.headText}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {action ?? null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  headText: { flex: 1, gap: spacing.xxs },
  title: { ...typography.role.itemTitle, color: colors.text.primary },
  subtitle: { ...typography.role.bodySecondary, color: colors.text.secondary }
});
