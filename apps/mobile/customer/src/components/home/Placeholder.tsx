import { StyleSheet, View, type DimensionValue } from "react-native";
import { colors, radius } from "@thigo/design-tokens";

type Props = {
  width?: DimensionValue;
  height: number;
  rounded?: "small" | "medium" | "large" | "full";
};

/** Static loading block that reserves layout; no shimmer, per UI_SYSTEM motion rules. */
export function Placeholder({
  width = "100%",
  height,
  rounded = "medium"
}: Props) {
  return (
    <View
      accessible={false}
      style={[styles.block, { width, height, borderRadius: radius[rounded] }]}
    />
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surface.secondary }
});
