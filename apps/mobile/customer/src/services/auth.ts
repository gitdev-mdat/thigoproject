import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createAuthClient, type ApplicationRole } from "@thigo/auth-client";

export const APP_ROLE: ApplicationRole = "CUSTOMER";
/** Matches the API default `OTP_RESEND_SECONDS`. */
export const OTP_RESEND_SECONDS = 60;

const sessionKey = "thigo.customer.session";
const env = (
  globalThis as { process?: { env?: { EXPO_PUBLIC_API_URL?: string } } }
).process?.env;

export const apiBaseUrl =
  env?.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3001"
    : "http://localhost:3001");

export const authClient = createAuthClient({
  baseUrl: apiBaseUrl,
  mode: "bearer"
});

export const sessionStore = {
  read: () => SecureStore.getItemAsync(sessionKey),
  write: (token: string) => SecureStore.setItemAsync(sessionKey, token),
  clear: () => SecureStore.deleteItemAsync(sessionKey)
};

export { authErrorMessage } from "./authMessages";
