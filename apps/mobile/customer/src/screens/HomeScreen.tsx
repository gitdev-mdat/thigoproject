import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";
import { AuthError, createAuthClient, type AuthUser } from "@thigo/auth-client";

const role = "CUSTOMER" as const;
const client = createAuthClient({
  baseUrl:
    (globalThis as { process?: { env?: { EXPO_PUBLIC_API_URL?: string } } })
      .process?.env?.EXPO_PUBLIC_API_URL ??
    (Platform.OS === "android"
      ? "http://10.0.2.2:3001"
      : "http://localhost:3001"),
  mode: "bearer"
});
const key = "thigo.customer.session";
const messageFor = (error: unknown) =>
  error instanceof AuthError && error.code === "forbidden"
    ? "Tài khoản chưa được phép sử dụng ứng dụng này."
    : error instanceof AuthError && error.code === "invalid"
      ? "Thông tin hoặc mã OTP không hợp lệ hoặc đã hết hạn."
      : error instanceof AuthError && error.code === "unavailable"
        ? "Dịch vụ mã xác thực tạm thời chưa sẵn sàng."
        : "Không thể kết nối. Vui lòng thử lại.";

export function HomeScreen() {
  const [step, setStep] = useState<
    "restoring" | "phone" | "otp" | "authenticated"
  >("restoring");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<AuthUser>();
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    void (async () => {
      const token = await SecureStore.getItemAsync(key);
      if (!token) return setStep("phone");
      try {
        const current = await client.getCurrentUser(token);
        await client.checkAccess(role, token);
        setUser(current);
        setStep("authenticated");
      } catch {
        await SecureStore.deleteItemAsync(key);
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setStep("phone");
      }
    })();
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, [cooldown]);
  const requestOtp = async () => {
    if (!/^\+?[0-9 ]{9,15}$/.test(phone.trim()))
      return setError("Vui lòng nhập số điện thoại hợp lệ.");
    setBusy(true);
    setError("");
    try {
      await client.requestOtp(phone, role);
      setStep("otp");
      setCooldown(30);
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) return setError("Mã OTP gồm 6 chữ số.");
    setBusy(true);
    setError("");
    try {
      const result = await client.verifyOtp(phone, otp, role);
      if (!result.token) throw new AuthError("unknown");
      await client.checkAccess(role, result.token);
      await SecureStore.setItemAsync(key, result.token);
      setUser(result.user);
      setStep("authenticated");
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    setBusy(true);
    const token = await SecureStore.getItemAsync(key);
    try {
      await client.logout(token ?? undefined);
    } catch {
      setError("Đã đăng xuất trên thiết bị. Máy chủ hiện không khả dụng.");
    } finally {
      await SecureStore.deleteItemAsync(key);
      setUser(undefined);
      setOtp("");
      setStep("phone");
      setBusy(false);
    }
  };
  if (step === "restoring")
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          accessibilityLabel="Đang khôi phục phiên đăng nhập"
          color={colors.brand.primary}
        />
        <Text style={styles.help}>Đang kiểm tra phiên đăng nhập…</Text>
      </SafeAreaView>
    );
  if (step === "authenticated")
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Xin chào</Text>
          <Text style={styles.body}>Bạn đã đăng nhập vào Thigo.</Text>
          <Text style={styles.help}>{user?.phone}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void logout()}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>
              {busy ? "Đang đăng xuất…" : "Đăng xuất"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>
          {step === "phone" ? "Đăng nhập" : "Nhập mã xác thực"}
        </Text>
        <Text style={styles.body}>
          {step === "phone"
            ? "Dùng số điện thoại Việt Nam của bạn."
            : `Mã OTP đã được gửi đến ${phone}.`}
        </Text>
        <Text style={styles.label}>
          {step === "phone" ? "Số điện thoại" : "Mã OTP"}
        </Text>
        <TextInput
          accessibilityLabel={step === "phone" ? "Số điện thoại" : "Mã OTP"}
          value={step === "phone" ? phone : otp}
          onChangeText={
            step === "phone"
              ? setPhone
              : (value) => setOtp(value.replace(/\D/g, "").slice(0, 6))
          }
          keyboardType="phone-pad"
          maxLength={step === "otp" ? 6 : 16}
          style={styles.input}
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void (step === "phone" ? requestOtp() : verify())}
          style={[styles.primary, busy && styles.disabled]}
        >
          <Text style={styles.primaryText}>
            {busy
              ? "Đang xử lý…"
              : step === "phone"
                ? "Gửi mã OTP"
                : "Đăng nhập"}
          </Text>
        </Pressable>
        {step === "otp" ? (
          <>
            <Pressable
              accessibilityRole="button"
              disabled={busy || cooldown > 0}
              onPress={() => void requestOtp()}
              style={styles.link}
            >
              <Text style={styles.linkText}>
                {cooldown ? `Gửi lại sau ${cooldown} giây` : "Gửi lại mã OTP"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              style={styles.link}
            >
              <Text style={styles.linkText}>Sửa số điện thoại</Text>
            </Pressable>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.primary },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.md,
    gap: spacing.sm
  },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  body: {
    ...typography.role.body,
    color: colors.text.primary,
    marginBottom: spacing.sm
  },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  label: { ...typography.role.label, color: colors.text.primary },
  input: {
    height: sizes.control.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.md,
    ...typography.role.body,
    color: colors.text.primary
  },
  error: { ...typography.role.bodySecondary, color: colors.status.danger },
  primary: {
    height: sizes.control.standard,
    borderRadius: radius.medium,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs
  },
  disabled: { backgroundColor: colors.action.disabled },
  primaryText: { ...typography.role.label, color: colors.text.inverse },
  secondary: {
    height: sizes.control.standard,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.medium,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md
  },
  secondaryText: { ...typography.role.label, color: colors.text.primary },
  link: {
    minHeight: sizes.touchTarget.recommended,
    alignItems: "center",
    justifyContent: "center"
  },
  linkText: {
    ...typography.role.label,
    color: colors.text.link,
    textDecorationLine: "underline"
  }
});
