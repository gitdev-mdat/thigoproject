import { StyleSheet, Text, View } from "react-native";
import { colors, radius, typography } from "@thigo/design-tokens";

import { initialOf } from "../../utils/storefront";
import { RemoteImage } from "../RemoteImage";

type Props = { name: string; imageUrl: string | null; size: number };

/** Product image, or the product's initial on a brand-subtle tile. */
export function ProductThumb({ name, imageUrl, size }: Props) {
  return (
    <RemoteImage
      url={imageUrl}
      style={[styles.frame, { width: size, height: size }]}
      fallback={
        <View style={styles.placeholder}>
          <Text style={styles.initial}>{initialOf(name)}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.small },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primarySubtle
  },
  initial: { ...typography.role.sectionTitle, color: colors.text.link }
});
