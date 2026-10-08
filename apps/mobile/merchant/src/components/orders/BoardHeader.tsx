import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { Chip } from "../Chip";
import { IconButton } from "../IconButton";

type Props = {
  title: string;
  subtitle?: string | undefined;
  paused?: boolean | undefined;
  /** Shows the account action when the header is used outside the tab shell. */
  onAccount?: (() => void) | undefined;
};

/** Title with store context and an optional account action; pads for the status bar. */
export function BoardHeader({ title, subtitle, paused, onAccount }: Props) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: top + spacing.xs }]}>
      <View style={styles.text}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {paused ? (
          <Chip label="Cửa hàng đang tạm ngưng bán" tone="warning" />
        ) : null}
      </View>
      {onAccount ? (
        <IconButton icon="user" label="Tài khoản" onPress={onAccount} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  text: { flex: 1, gap: spacing.xxs, paddingTop: spacing.xxs },
  title: { ...typography.role.sectionTitle, color: colors.text.primary },
  subtitle: { ...typography.role.bodySecondary, color: colors.text.secondary }
});
