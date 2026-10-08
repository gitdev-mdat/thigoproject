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
const role = "DRIVER" as const;
const key = "thigo.driver.session";
const env = (
  globalThis as { process?: { env?: { EXPO_PUBLIC_API_URL?: string } } }
).process?.env;
const client = createAuthClient({
  baseUrl:
    env?.EXPO_PUBLIC_API_URL ??
    (Platform.OS === "android"
      ? "http://10.0.2.2:3001"
      : "http://localhost:3001"),
  mode: "bearer"
});
const message = (e: unknown) =>
  e instanceof AuthError && e.code === "forbidden"
    ? "Tài khoản chưa được cấp quyền Tài xế."
    : e instanceof AuthError && e.code === "invalid"
      ? "Thông tin hoặc mã OTP không hợp lệ hoặc đã hết hạn."
      : e instanceof AuthError && e.code === "unavailable"
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
        setError("Phiên đăng nhập không còn hợp lệ.");
        setStep("phone");
      }
    })();
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(
      () => setCooldown((v) => Math.max(0, v - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, [cooldown]);
  const request = async () => {
    if (!/^\+?[0-9 ]{9,15}$/.test(phone.trim()))
      return setError("Vui lòng nhập số điện thoại hợp lệ.");
    setBusy(true);
    setError("");
    try {
      await client.requestOtp(phone, role);
      setStep("otp");
      setCooldown(30);
    } catch (e) {
      setError(message(e));
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
      setError(message(e));
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
      <SafeAreaView style={s.center}>
        <ActivityIndicator color={colors.brand.primary} />
        <Text style={s.help}>Đang kiểm tra phiên đăng nhập…</Text>
      </SafeAreaView>
    );
  if (step === "authenticated")
    return (
      <SafeAreaView style={s.container}>
        <View style={s.content}>
          <Text style={s.title}>Xin chào Tài xế</Text>
          <Text style={s.body}>Bạn đã đăng nhập vào Thigo.</Text>
          <Text style={s.help}>{user?.phone}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void logout()}
            style={s.secondary}
          >
            <Text style={s.secondaryText}>
              {busy ? "Đang đăng xuất…" : "Đăng xuất"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        style={s.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={s.title}>
          {step === "phone" ? "Đăng nhập Tài xế" : "Nhập mã xác thực"}
        </Text>
        <Text style={s.body}>
          {step === "phone"
            ? "Dùng số điện thoại đã được cấp quyền."
            : `Mã OTP đã được gửi đến ${phone}.`}
        </Text>
        <Text style={s.label}>
          {step === "phone" ? "Số điện thoại" : "Mã OTP"}
        </Text>
        <TextInput
          accessibilityLabel={step === "phone" ? "Số điện thoại" : "Mã OTP"}
          value={step === "phone" ? phone : otp}
          onChangeText={
            step === "phone"
              ? setPhone
              : (v) => setOtp(v.replace(/\D/g, "").slice(0, 6))
          }
          keyboardType="phone-pad"
          maxLength={step === "otp" ? 6 : 16}
          style={s.input}
        />
        {error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void (step === "phone" ? request() : verify())}
          style={[s.primary, busy && s.disabled]}
        >
          <Text style={s.primaryText}>
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
              disabled={busy || cooldown > 0}
              onPress={() => void request()}
              style={s.link}
            >
              <Text style={s.linkText}>
                {cooldown ? `Gửi lại sau ${cooldown} giây` : "Gửi lại mã OTP"}
              </Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              style={s.link}
            >
              <Text style={s.linkText}>Sửa số điện thoại</Text>
            </Pressable>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
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
    justifyContent: "center"
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
