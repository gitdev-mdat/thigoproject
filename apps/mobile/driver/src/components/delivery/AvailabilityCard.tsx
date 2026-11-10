import { StyleSheet, Switch, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { DriverStatus } from "../../types/driver";

type Props = {
  status: DriverStatus | undefined;
  busy: boolean;
  error: string;
  onChange: (online: boolean) => void;
};

export function AvailabilityCard({ status, busy, error, onChange }: Props) {
  const online = status?.presence?.isOnline ?? false;
  const detail = !status
    ? "Đang kiểm tra trạng thái…"
    : status.activeDeliveryId
      ? "Đang thực hiện một đơn giao"
      : status.eligibleForOffers
        ? "Vị trí đã sẵn sàng để nhận đề nghị"
        : online
          ? "Đang chờ vị trí GPS chính xác"
          : "Bạn sẽ không nhận đề nghị mới";
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>Sẵn sàng nhận đơn</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
        <Switch
          accessibilityLabel="Bật hoặc tắt nhận đơn"
          value={online}
          disabled={busy || !status?.profile}
          onValueChange={onChange}
          trackColor={{
            false: colors.border.default,
            true: colors.brand.primary
          }}
        />
      </View>
      {status?.profile ? (
        <Text style={styles.vehicle}>
          {status.profile.displayName} · {status.profile.vehiclePlate}
        </Text>
      ) : status ? (
        <Text style={styles.error}>Hồ sơ phương tiện chưa được thiết lập.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  copy: { flex: 1, gap: spacing.xxs },
  title: { ...typography.role.itemTitle, color: colors.text.primary },
  detail: { ...typography.role.bodySecondary, color: colors.text.secondary },
  vehicle: { ...typography.role.caption, color: colors.text.secondary },
  error: { ...typography.role.caption, color: colors.status.danger }
});
