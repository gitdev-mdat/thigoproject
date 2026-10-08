import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { IconButton } from "./IconButton";

type Props = { title: string; subtitle?: string; onBack: () => void };

/** Title bar for drill-in screens, with a visible back action. */
export function ScreenHeader({ title, subtitle, onBack }: Props) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: top + spacing.xxs }]}>
      <IconButton icon="back" label="Quay lại" onPress={onBack} />
      <View style={styles.text}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
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
  text: { flex: 1, paddingRight: spacing.md },
  title: {
    ...typography.role.itemTitle,
    fontSize: 18,
    color: colors.text.primary
  },
  subtitle: { ...typography.role.caption, color: colors.text.secondary }
});
