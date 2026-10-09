import { useEffect } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { FieldMessage } from "../components/FieldMessage";
import { Notice } from "../components/Notice";
import { OtpField } from "../components/OtpField";
import { PhoneField } from "../components/PhoneField";
import type { AuthSession } from "../hooks/useAuthSession";
import { androidTopInset } from "../utils/layout";
import { formatCountdown, formatPhone } from "../utils/phone";

const copy = {
  role: "Khách hàng",
  phoneTitle: "Chào mừng đến THIGO",
  phoneBody: "Đăng nhập bằng số điện thoại để xem cửa hàng và thực đơn.",
  otpTitle: "Nhập mã xác thực",
  otpBody: "Một bước nữa là bạn có thể bắt đầu khám phá.",
  footer: "Không cần mật khẩu. Số điện thoại là tài khoản của bạn."
};

type Props = { session: AuthSession };

export function LoginScreen({ session }: Props) {
  const isOtp = session.step === "otp";
  const { changePhone } = session;

  // Android back returns from the code step to the phone step instead of leaving the app.
  useEffect(() => {
    if (!isOtp) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        changePhone();
        return true;
      }
    );
    return () => subscription.remove();
  }, [isOtp, changePhone]);
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.hero}>
            <BrandMark role={copy.role} />
            <View style={styles.heroText}>
              <Text style={styles.title} accessibilityRole="header">
                {isOtp ? copy.otpTitle : copy.phoneTitle}
              </Text>
              <Text style={styles.body}>
                {isOtp ? copy.otpBody : copy.phoneBody}
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            {session.notice ? <Notice message={session.notice} /> : null}
            {isOtp ? (
              <>
                <View style={styles.sentTo}>
                  <View style={styles.flex}>
                    <Text style={styles.caption}>Mã đã gửi đến</Text>
                    <Text style={styles.phone}>
                      {formatPhone(session.phone)}
                    </Text>
                  </View>
                  <Button
                    label="Đổi số"
                    variant="tertiary"
                    disabled={session.busy}
                    onPress={session.changePhone}
                  />
                </View>
                <View style={styles.field}>
                  <OtpField
                    value={session.otp}
                    onChangeText={session.updateOtp}
                    error={session.error}
                  />
                  <FieldMessage error={session.error} />
                </View>
                <Button
                  label="Xác nhận và đăng nhập"
                  loadingLabel="Đang xác thực…"
                  prominent
                  loading={session.busy}
                  onPress={() => void session.verify()}
                />
                <View style={styles.resend}>
                  <Text style={styles.help}>Chưa nhận được mã?</Text>
                  <Button
                    label={
                      session.cooldown
                        ? `Gửi lại sau ${formatCountdown(session.cooldown)}`
                        : "Gửi lại mã"
                    }
                    variant="tertiary"
                    disabled={session.busy || session.cooldown > 0}
                    onPress={() => void session.requestOtp()}
                  />
                </View>
              </>
            ) : (
              <>
                <PhoneField
                  value={session.phone}
                  onChangeText={session.updatePhone}
                  onSubmit={() => void session.requestOtp()}
                  error={session.error}
                  editable={!session.busy}
                />
                <Button
                  label="Gửi mã xác thực"
                  loadingLabel="Đang gửi mã…"
                  prominent
                  loading={session.busy}
                  onPress={() => void session.requestOtp()}
                />
                <Text style={styles.footer}>{copy.footer}</Text>
                {session.quickLogin?.accounts.length ? (
                  <View style={styles.devLogin}>
                    <Text style={styles.devTag}>
                      DEV · Chỉ có khi chạy cục bộ với dữ liệu mẫu
                    </Text>
                    {session.quickLogin.accounts.map((account) => (
                      <Button
                        key={account.phone}
                        variant="secondary"
                        label={`Đăng nhập nhanh (DEV) · ${account.label}`}
                        loadingLabel="Đang đăng nhập…"
                        loading={session.busy}
                        onPress={() => void session.signInQuickly(account)}
                      />
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand.primarySubtle },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    paddingTop: androidTopInset + spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg
  },
  heroText: { gap: spacing.xs },
  title: { ...typography.role.screenTitle, color: colors.text.primary },
  body: { ...typography.role.body, color: colors.text.secondary },
  form: {
    flexGrow: 1,
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md
  },
  field: { gap: spacing.xs },
  sentTo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface.secondary
  },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  phone: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  },
  resend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing.xxs
  },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  devLogin: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.default,
    backgroundColor: colors.status.warningBackground
  },
  devTag: { ...typography.role.caption, color: colors.status.warning },
  footer: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    textAlign: "center"
  }
});
