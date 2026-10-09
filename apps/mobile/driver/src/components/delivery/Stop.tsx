import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import { Icon } from "../Icon";

type Props = {
  kind: "pickup" | "dropoff";
  title: string;
  line: string;
  note?: string | null;
  /** The stop the driver is heading to now. */
  active?: boolean;
  /** The stop is already behind the driver. */
  done?: boolean;
};

const captions = {
  pickup: { active: "Lấy món tại", done: "Đã lấy món tại" },
  dropoff: { active: "Giao đến", done: "Giao đến" }
} as const;

/** One end of the trip: the store (pickup) or the customer (drop-off). */
export function Stop({ kind, title, line, note, active = false, done }: Props) {
  const caption = done ? captions[kind].done : captions[kind].active;
  return (
    <View
      style={[styles.stop, active && styles.active]}
      accessible
      accessibilityLabel={[caption, title, line, note ? `Ghi chú: ${note}` : ""]
        .filter(Boolean)
        .join(". ")}
    >
      <View style={[styles.badge, active && styles.badgeActive]}>
        <Icon
          name={done ? "check" : kind === "pickup" ? "bag" : "pin"}
          size={sizes.icon.standard}
          color={active ? colors.text.inverse : colors.text.secondary}
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.caption}>{caption}</Text>
        <Text style={[styles.title, done && styles.muted]}>{title}</Text>
        <Text style={[styles.line, done && styles.muted]}>{line}</Text>
        {note ? <Text style={styles.note}>Ghi chú: {note}</Text> : null}
      </View>
    </View>
  );
}

const BADGE = sizes.control.compact;

const styles = StyleSheet.create({
  stop: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  active: { borderColor: colors.border.focus, borderWidth: 2 },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.secondary
  },
  badgeActive: { backgroundColor: colors.brand.primary },
  text: { flex: 1, gap: spacing.xxs },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  title: { ...typography.role.itemTitle, color: colors.text.primary },
  line: { ...typography.role.body, color: colors.text.primary },
  muted: { color: colors.text.secondary },
  note: {
    ...typography.role.bodySecondary,
    color: colors.status.warning,
    backgroundColor: colors.status.warningBackground,
    borderRadius: radius.small,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    marginTop: spacing.xxs,
    overflow: "hidden"
  }
});
