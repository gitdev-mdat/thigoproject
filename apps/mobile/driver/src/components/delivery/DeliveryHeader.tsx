import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { BrandMark } from "../BrandMark";

type Props = { status: string };

/** Solid brand header shared by every driver state; `status` is the freshness line. */
export function DeliveryHeader({ status }: Props) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: top + spacing.sm }]}>
      <BrandMark role="Tài xế" tone="dark" />
      <Text
        style={styles.status}
        numberOfLines={1}
        accessibilityLiveRegion="polite"
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.brand.primary
  },
  status: {
    ...typography.role.caption,
    flex: 1,
    textAlign: "right",
    color: colors.text.inverse,
    fontVariant: ["tabular-nums"]
  }
});
