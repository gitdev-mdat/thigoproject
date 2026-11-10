import { Platform, StatusBar } from "react-native";

/**
 * React Native's SafeAreaView only pads on iOS; Android draws edge-to-edge,
 * so screens add the status bar height themselves.
 */
export const androidTopInset =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
