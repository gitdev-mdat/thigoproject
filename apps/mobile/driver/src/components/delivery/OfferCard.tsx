import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { DeliveryOffer } from "../../types/dispatch";
import { formatItemCount, formatVnd } from "../../utils/delivery";
import { Button } from "../Button";
import { Chip } from "../Chip";

type Props = {
  offer: DeliveryOffer;
  pending: "accept" | "reject" | undefined;
  onAccept: () => void;
  onReject: () => void;
  onExpired: () => void;
};

const minutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));
const distance = (meters: number) =>
  meters < 1_000 ? `${meters} m` : `${(meters / 1_000).toFixed(1)} km`;

/** One server-owned, expiring offer. Exact drop-off details stay hidden. */
export function OfferCard({
  offer,
  pending,
  onAccept,
  onReject,
  onExpired
}: Props) {
  const [now, setNow] = useState(Date.now());
  const expired = useRef(false);
  const secondsLeft = Math.max(
    0,
    Math.ceil((new Date(offer.expiresAt).getTime() - now) / 1_000)
  );

  useEffect(() => {
    expired.current = false;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [offer.id]);

  useEffect(() => {
    if (secondsLeft === 0 && !expired.current) {
      expired.current = true;
      onExpired();
    }
  }, [onExpired, secondsLeft]);

  const etaLabel =
    offer.etaSource === "ROUTING"
      ? `${minutes(offer.pickupEtaSeconds)} phút đến quán`
      : `Ước tính ${minutes(offer.pickupEtaSeconds)} phút đến quán`;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Chip label="Đề nghị mới" tone="info" />
        <Text style={styles.timer}>Còn {secondsLeft} giây</Text>
      </View>
      <Text style={styles.title}>{offer.delivery.storeName}</Text>
      <Text style={styles.line}>{offer.delivery.storeAddressLine}</Text>
      <Text style={styles.meta}>
        {etaLabel} · Cách thẳng {distance(offer.straightLineDistanceMeters)}
      </Text>
      <Text style={styles.meta}>
        {formatItemCount(offer.delivery.itemCount)} · Thu hộ{" "}
        {formatVnd(offer.delivery.totalVnd)}
      </Text>
      <Text style={styles.dropoff}>
        Khu vực giao: {offer.delivery.delivery.line}
      </Text>
      <View style={styles.actions}>
        <Button
          label="Từ chối"
          variant="secondary"
          loading={pending === "reject"}
          loadingLabel="Đang từ chối…"
          disabled={pending !== undefined || secondsLeft === 0}
          onPress={onReject}
          style={styles.action}
        />
        <Button
          label="Nhận đơn"
          loading={pending === "accept"}
          loadingLabel="Đang nhận đơn…"
          disabled={pending !== undefined || secondsLeft === 0}
          onPress={onAccept}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 2,
    borderColor: colors.border.focus,
    backgroundColor: colors.surface.primary
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs
  },
  timer: {
    ...typography.role.label,
    color: colors.status.warning,
    fontVariant: ["tabular-nums"]
  },
  title: { ...typography.role.sectionTitle, color: colors.text.primary },
  line: { ...typography.role.body, color: colors.text.primary },
  meta: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"]
  },
  dropoff: { ...typography.role.bodySecondary, color: colors.text.primary },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  action: { flex: 1 }
});
