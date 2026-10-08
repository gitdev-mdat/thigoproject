import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { Icon } from "../Icon";

type Props = { title: string; detail: string; onPress: () => void };

/** "Đơn gần đây" sits apart from the discovery categories as its own row. */
export function RecentOrdersEntry({ title, detail, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon name="receipt" color={colors.brand.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Icon
        name="forward"
        size={sizes.icon.small}
        color={colors.text.secondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.large,
    backgroundColor: colors.surface.secondary
  },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.primary
  },
  text: { flex: 1, gap: 2 },
  title: { ...typography.role.label, color: colors.text.primary },
  detail: { ...typography.role.caption, color: colors.text.secondary }
});
