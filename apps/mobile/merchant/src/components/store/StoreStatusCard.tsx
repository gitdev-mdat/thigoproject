import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import type { MerchantStoreProfile } from "../../types/storefront";
import { todayHours } from "../../utils/hours";
import { storeStatus } from "../../utils/storefront";
import { Notice } from "../Notice";
import { ToggleRow } from "../ToggleRow";

const tones = {
  success: {
    background: colors.status.successBackground,
    text: colors.status.success
  },
  warning: {
    background: colors.status.warningBackground,
    text: colors.status.warning
  },
  info: { background: colors.status.infoBackground, text: colors.status.info },
  neutral: { background: colors.surface.secondary, text: colors.text.secondary }
} as const;

type Props = {
  store: MerchantStoreProfile;
  busy: boolean;
  error?: string | undefined;
  onAcceptingChange: (value: boolean) => void;
};

/** What customers see now, with the store's open/pause switch. */
export function StoreStatusCard({
  store,
  busy,
  error,
  onAcceptingChange
}: Props) {
  const status = storeStatus(store);
  const tone = tones[status.tone];
  return (
    <View style={styles.card}>
      <View
        style={[styles.banner, { backgroundColor: tone.background }]}
        accessible
        accessibilityLabel={`Trạng thái cửa hàng: ${status.label}. ${status.detail}`}
        accessibilityLiveRegion="polite"
      >
        <View style={[styles.dot, { backgroundColor: tone.text }]} />
        <View style={styles.bannerText}>
          <Text style={[styles.status, { color: tone.text }]}>
            {status.label}
          </Text>
          <Text style={[styles.detail, { color: tone.text }]}>
            {status.detail}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <ToggleRow
          prominent
          title={
            store.isAcceptingOrders
              ? "Đang nhận đơn"
              : "Đang tạm ngưng nhận đơn"
          }
          description={
            store.isAcceptingOrders
              ? `Tắt khi quán quá tải hoặc tạm nghỉ. ${todayHours(store.openingHours)}.`
              : "Bật lại khi quán sẵn sàng nhận đơn mới."
          }
          value={store.isAcceptingOrders}
          disabled={busy}
          onChange={onAcceptingChange}
        />
        {error ? <Notice message={error} tone="danger" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
    overflow: "hidden"
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.xs
  },
  bannerText: { flex: 1, gap: spacing.xxs },
  status: typography.role.sectionTitle,
  detail: typography.role.bodySecondary,
  body: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs
  }
});
