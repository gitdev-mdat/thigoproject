import { colors, elevation } from "@thigo/design-tokens";
import { Platform, StatusBar } from "react-native";

/**
 * React Native's SafeAreaView only pads on iOS; Android draws edge-to-edge,
 * so screens add the status bar height themselves.
 */
export const androidTopInset =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

/** Native rendering of the `elevation.raised` token for cards that float. */
export const raisedShadow = {
  elevation: elevation.raised.level,
  shadowColor: colors.text.primary,
  shadowOpacity: 0.14,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 }
} as const;

/** Native rendering of the `elevation.overlay` token. */
export const overlayShadow = {
  elevation: elevation.overlay.level,
  shadowColor: colors.text.primary,
  shadowOpacity: 0.18,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 }
} as const;
