import { useRef, useState, type ReactNode } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { colors, motion } from "@thigo/design-tokens";

import { useReduceMotion } from "../hooks/useReduceMotion";
import { resolveMediaUrl } from "../services/api";

type Props = {
  /** API-relative or absolute URL, or a local file URI for a fresh pick. */
  url: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  /** Shown when there is no image or it fails to load. */
  fallback?: ReactNode;
};

/** Image on a neutral tile that fades in once loaded (no fade with reduced motion). */
export function RemoteImage({ url, style, imageStyle, fallback }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();
  const [failedUri, setFailedUri] = useState<string>();
  const uri = resolveMediaUrl(url);
  const failed = uri !== undefined && failedUri === uri;
  return (
    <View style={[styles.frame, style]} accessible={false}>
      {!uri || failed ? (fallback ?? null) : null}
      {uri && !failed ? (
        <Animated.Image
          key={uri}
          source={{ uri }}
          resizeMode="cover"
          onError={() => setFailedUri(uri)}
          onLoadStart={() => opacity.setValue(0)}
          onLoad={() =>
            reduceMotion
              ? opacity.setValue(1)
              : Animated.timing(opacity, {
                  toValue: 1,
                  duration: motion.duration.standard,
                  useNativeDriver: true
                }).start()
          }
          style={[StyleSheet.absoluteFill, { opacity }, imageStyle]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: colors.surface.secondary }
});
