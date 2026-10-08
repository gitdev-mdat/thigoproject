import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@thigo/design-tokens";

type Props = {
  art: string;
  size: number;
  tone?: "brand" | "neutral" | "surface";
  rounded?: "medium" | "large" | "full";
};

/** Placeholder artwork (an emoji on a tinted tile) until real images exist. */
export function ArtTile({
  art,
  size,
  tone = "brand",
  rounded = "medium"
}: Props) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: radius[rounded],
          backgroundColor: toneColor[tone]
        }
      ]}
    >
      <Text
        style={{
          fontSize: Math.round(size * 0.5),
          lineHeight: Math.round(size * 0.62)
        }}
      >
        {art}
      </Text>
    </View>
  );
}

const toneColor = {
  brand: colors.brand.primarySubtle,
  neutral: colors.surface.secondary,
  surface: colors.surface.primary
} as const;

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center" }
});
