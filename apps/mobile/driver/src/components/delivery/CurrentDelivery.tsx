import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { Delivery } from "../../types/delivery";
import {
  formatClock,
  formatItemCount,
  optionsSummary,
  telUrl,
  type DeliveryStage
} from "../../utils/delivery";
import { formatPhone } from "../../utils/phone";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { CashToCollect } from "./CashToCollect";
import { Stop } from "./Stop";

type Props = { delivery: Delivery; stage: DeliveryStage };

/** The driver's one active job: where to go, whom to call, what to collect. */
export function CurrentDelivery({ delivery, stage }: Props) {
  const pickedUp = stage.target === "dropoff";
  const phone = delivery.customerPhone;
  const call = async (number: string) => {
    try {
      await Linking.openURL(telUrl(number));
    } catch {
      Alert.alert(
        "Chưa mở được cuộc gọi",
        `Hãy gọi khách theo số ${formatPhone(number)}.`
      );
    }
  };
  const claimedAt = delivery.timeline.assignedAt;

  return (
    <View style={styles.stack}>
      <View style={styles.stage}>
        <Chip label={stage.chip.label} tone={stage.chip.tone} />
        <Text style={styles.title} accessibilityRole="header">
          {stage.title}
        </Text>
        <Text style={styles.meta}>
          Đơn {delivery.code} · {formatItemCount(delivery.itemCount)}
          {claimedAt ? ` · Nhận lúc ${formatClock(claimedAt)}` : ""}
        </Text>
        <CashToCollect amount={delivery.totalVnd} />
      </View>

      <Stop
        kind="pickup"
        title={delivery.storeName}
        line={delivery.storeAddressLine}
        active={!pickedUp}
        done={pickedUp}
      />
      <Stop
        kind="dropoff"
        title={delivery.delivery.label}
        line={delivery.delivery.line}
        note={delivery.delivery.note}
        active={pickedUp}
      />

      {phone ? (
        <View style={styles.card}>
          <View style={styles.contact}>
            <Text style={styles.caption}>Số điện thoại khách</Text>
            <Text style={styles.phone}>{formatPhone(phone)}</Text>
          </View>
          <Button
            label="Gọi khách"
            variant="secondary"
            prominent
            onPress={() => void call(phone)}
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.section} accessibilityRole="header">
          Món trong đơn
        </Text>
        {delivery.items.map((item, index) => {
          const options = optionsSummary(item);
          return (
            <View key={`${item.productId}-${index}`} style={styles.item}>
              <Text style={styles.quantity}>{item.quantity}×</Text>
              <View style={styles.itemText}>
                <Text style={styles.itemName}>{item.name}</Text>
                {options ? <Text style={styles.caption}>{options}</Text> : null}
              </View>
            </View>
          );
        })}
        {delivery.customerNote ? (
          <View style={styles.note}>
            <Text style={styles.noteLabel}>Ghi chú của khách</Text>
            <Text style={styles.noteText}>{delivery.customerNote}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  stage: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.large,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle
  },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  meta: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"],
    marginBottom: spacing.xxs
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle
  },
  contact: { gap: spacing.xxs },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  phone: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  section: { ...typography.role.itemTitle, color: colors.text.primary },
  item: { flexDirection: "row", gap: spacing.xs },
  quantity: {
    ...typography.role.itemTitle,
    minWidth: spacing.xl,
    color: colors.text.link,
    fontVariant: ["tabular-nums"]
  },
  itemText: { flex: 1, gap: spacing.xxs },
  itemName: { ...typography.role.body, color: colors.text.primary },
  note: {
    gap: spacing.xxs,
    padding: spacing.sm,
    borderRadius: radius.medium,
    backgroundColor: colors.status.warningBackground
  },
  noteLabel: { ...typography.role.label, color: colors.status.warning },
  noteText: { ...typography.role.body, color: colors.text.primary }
});
