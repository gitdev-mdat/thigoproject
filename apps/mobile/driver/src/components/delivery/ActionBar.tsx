import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import type { StageAction } from "../../utils/delivery";
import { Button } from "../Button";

type Props = {
  action: StageAction;
  loading: boolean;
  onPress: () => void;
};

const loadingLabels = {
  wait: "Đã lấy hàng",
  pickup: "Đang xác nhận lấy hàng…",
  deliver: "Đang xác nhận giao…"
} as const;

/** The one next step for the current job, pinned above the system navigation bar. */
export function ActionBar({ action, loading, onPress }: Props) {
  const { bottom } = useSafeAreaInsets();
  const waiting = action.kind === "wait";
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottom, spacing.sm) }]}>
      {waiting ? (
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {action.hint}
        </Text>
      ) : null}
      <Button
        label={action.label}
        loadingLabel={loadingLabels[action.kind]}
        prominent
        loading={loading}
        disabled={waiting}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  hint: {
    ...typography.role.label,
    color: colors.status.warning,
    textAlign: "center"
  }
});
