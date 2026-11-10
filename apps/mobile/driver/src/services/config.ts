import { Platform } from "react-native";

const env = (
  globalThis as { process?: { env?: { EXPO_PUBLIC_API_URL?: string } } }
).process?.env;

/** API origin shared by the auth client and the delivery endpoints. */
export const apiBaseUrl =
  env?.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3001"
    : "http://localhost:3001");
