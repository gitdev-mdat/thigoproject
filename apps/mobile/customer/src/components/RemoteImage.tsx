import { useRef } from "react";
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
  url: string | null;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

/** Catalog image on a neutral tile that fades in once loaded. */
export function RemoteImage({ url, style, imageStyle }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();
  const uri = resolveMediaUrl(url);
  return (
    <View style={[styles.frame, style]} accessible={false}>
      {uri ? (
        <Animated.Image
          source={{ uri }}
          resizeMode="cover"
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
