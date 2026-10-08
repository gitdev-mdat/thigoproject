import { Platform } from "react-native";

const env = (
  globalThis as { process?: { env?: { EXPO_PUBLIC_API_URL?: string } } }
).process?.env;

/** Base URL of the THIGO API; resolved the same way as the auth client's. */
export const apiBaseUrl =
  env?.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3001"
    : "http://localhost:3001");
