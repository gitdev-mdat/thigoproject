import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@thigo/design-tokens";

type Props = { color?: string };

/**
 * A solid band behind the transparent edge-to-edge status bar, so scrolled
 * content never runs under the clock and system icons. Render it last, after
 * the screen's scroll view.
 */
export function StatusBarScrim({ color = colors.surface.primary }: Props) {
  const { top } = useSafeAreaInsets();
  if (!top) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.scrim, { height: top, backgroundColor: color }]}
    />
  );
}

const styles = StyleSheet.create({
  scrim: { position: "absolute", top: 0, left: 0, right: 0 }
});
