import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { Promotion } from "../../types/home";

type Props = { promotion: Promotion };

/** Supporting promotion; sits below the primary intents, never beside them. */
export function PromoBanner({ promotion }: Props) {
  return (
    <View style={styles.banner} accessible>
      <View style={styles.text}>
        <Text style={styles.eyebrow}>{promotion.eyebrow}</Text>
        <Text style={styles.title}>{promotion.title}</Text>
        <Text style={styles.description}>{promotion.description}</Text>
        {promotion.code ? (
          <View style={styles.code}>
            <Text style={styles.codeText}>Mã {promotion.code}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.art} accessible={false}>
        🛵
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    backgroundColor: colors.brand.primary,
    overflow: "hidden"
  },
  text: { flex: 1, gap: spacing.xxs },
  eyebrow: { ...typography.role.caption, color: colors.text.inverse },
  title: { ...typography.role.itemTitle, color: colors.text.inverse },
  description: { ...typography.role.bodySecondary, color: colors.text.inverse },
  code: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.surface.primary
  },
  codeText: { ...typography.role.label, color: colors.text.link },
  art: { fontSize: spacing.xxl, lineHeight: spacing.xxl + spacing.sm }
});
