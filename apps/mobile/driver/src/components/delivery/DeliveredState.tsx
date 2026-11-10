import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import type { Delivery } from "../../types/delivery";
import { formatVnd } from "../../utils/delivery";
import { Button } from "../Button";
import { Icon } from "../Icon";

type Props = { delivery: Delivery; onDone: () => void };

/** Brief confirmation after a delivery; the list returns on its own shortly after. */
export function DeliveredState({ delivery, onDone }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Icon
          name="check"
          size={sizes.icon.large}
          color={colors.status.success}
        />
      </View>
      <View style={styles.text} accessible accessibilityLiveRegion="polite">
        <Text style={styles.title} accessibilityRole="header">
          Đã giao thành công
        </Text>
        <Text style={styles.body}>
          Đơn {delivery.code} · Đã thu {formatVnd(delivery.totalVnd)} tiền mặt
        </Text>
      </View>
      <Button
        label="Xem đơn mới"
        prominent
        style={styles.action}
        onPress={onDone}
      />
    </View>
  );
}

const BADGE = sizes.control.prominent;

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.status.successBackground
  },
  text: { alignItems: "center", gap: spacing.xxs },
  title: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    textAlign: "center"
  },
  body: {
    ...typography.role.body,
    color: colors.text.secondary,
    textAlign: "center",
    fontVariant: ["tabular-nums"]
  },
  action: { alignSelf: "stretch" }
});
