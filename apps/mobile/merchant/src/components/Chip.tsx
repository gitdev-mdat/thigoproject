import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

const tones = {
  neutral: {
    background: colors.surface.secondary,
    text: colors.text.secondary
  },
  brand: { background: colors.brand.primarySubtle, text: colors.text.link },
  info: { background: colors.status.infoBackground, text: colors.status.info },
  warning: {
    background: colors.status.warningBackground,
    text: colors.status.warning
  }
} as const;

type Props = { label: string; tone?: keyof typeof tones };

export function Chip({ label, tone = "neutral" }: Props) {
  return (
    <View style={[styles.chip, { backgroundColor: tones[tone].background }]}>
      <Text style={[styles.label, { color: tones[tone].text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full
  },
  label: typography.role.caption
});
