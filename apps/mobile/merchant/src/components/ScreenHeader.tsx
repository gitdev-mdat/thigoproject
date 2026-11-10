import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { IconButton } from "./IconButton";

type Props = {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  /** Disables back while a request must finish first. */
  backDisabled?: boolean;
  /** Optional trailing action, e.g. a tertiary button. */
  action?: ReactNode;
};

/** Title bar for drill-in screens, with a visible back action. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backDisabled = false,
  action
}: Props) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: top + spacing.xxs }]}>
      <IconButton
        icon="back"
        label="Quay lại"
        onPress={onBack}
        disabled={backDisabled}
      />
      <View style={styles.text}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  text: { flex: 1, paddingRight: spacing.xs },
  title: { ...typography.role.itemTitle, color: colors.text.primary },
  subtitle: { ...typography.role.caption, color: colors.text.secondary }
});
