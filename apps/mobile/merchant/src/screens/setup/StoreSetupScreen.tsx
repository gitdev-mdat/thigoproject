import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { AccountSheet } from "../../components/AccountSheet";
import { BrandMark } from "../../components/BrandMark";
import { Button } from "../../components/Button";
import { Notice } from "../../components/Notice";
import { StoreProfileFields } from "../../components/store/StoreProfileFields";
import type { AuthSession } from "../../hooks/useAuthSession";
import type { Storefront } from "../../hooks/useStorefront";
import { createStore } from "../../services/storefront";
import { maskPhone } from "../../utils/phone";
import {
  hasErrors,
  profileDraft,
  profileInput,
  validateProfile,
  type StoreProfileDraft,
  type StoreProfileErrors
} from "../../utils/storefront";

type Props = {
  session: AuthSession;
  storefront: Storefront;
  onCreated: () => void;
};

/** One short screen that creates the merchant's store. */
export function StoreSetupScreen({ session, storefront, onCreated }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const [draft, setDraft] = useState<StoreProfileDraft>(() =>
    profileDraft(null)
  );
  const [errors, setErrors] = useState<StoreProfileErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);

  const change = (patch: Partial<StoreProfileDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setServerError("");
    // After the first attempt, errors update as the owner fixes them.
    if (submitted) setErrors(validateProfile(next));
  };

  const submit = async () => {
    setSubmitted(true);
    const found = validateProfile(draft);
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    setServerError("");
    const result = await storefront.mutateStore(() =>
      createStore(profileInput(draft))
    );
    setSaving(false);
    if (result.ok) return onCreated();
    // 409: a store already exists (another device); load it instead.
    if (result.status === 409) return void storefront.loadOverview();
    setServerError(result.message);
  };

  const phone = session.user ? maskPhone(session.user.phone) : undefined;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, { paddingTop: top + spacing.lg }]}>
            <BrandMark role="Nhà bán hàng" tone="dark" />
            <View style={styles.heroText}>
              <Text style={styles.title} accessibilityRole="header">
                Thiết lập cửa hàng
              </Text>
              <Text style={styles.body}>
                Vài thông tin cơ bản là đủ để bắt đầu. Ảnh, thực đơn và giờ mở
                cửa có thể thêm ngay sau bước này.
              </Text>
            </View>
          </View>
          <View style={[styles.form, { paddingBottom: bottom + spacing.xl }]}>
            <StoreProfileFields
              draft={draft}
              errors={errors}
              editable={!saving}
              onChange={change}
            />
            {serverError ? (
              <Notice message={serverError} tone="danger" />
            ) : null}
            {submitted && hasErrors(errors) ? (
              <Text style={styles.hint} accessibilityRole="alert">
                Kiểm tra lại các ô được đánh dấu.
              </Text>
            ) : null}
            <Button
              label="Tạo cửa hàng"
              loadingLabel="Đang tạo cửa hàng…"
              prominent
              loading={saving}
              onPress={() => void submit()}
            />
            <Text style={styles.footer}>
              Cửa hàng chỉ hiển thị với khách khi bạn bật “Hiển thị cửa hàng”.
            </Text>
            <View style={styles.account}>
              <Text style={styles.accountText}>
                {phone ? `Đang đăng nhập: ${phone}` : "Đang đăng nhập"}
              </Text>
              <Button
                label="Đăng xuất"
                variant="tertiary"
                disabled={saving}
                onPress={() => setAccountOpen(true)}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AccountSheet
        visible={accountOpen}
        phone={phone}
        busy={session.busy}
        onClose={() => setAccountOpen(false)}
        onLogout={() => void session.logout()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.inverse },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg
  },
  heroText: { gap: spacing.xs },
  title: { ...typography.role.screenTitle, color: colors.text.inverse },
  body: { ...typography.role.body, color: colors.text.inverse },
  form: {
    flexGrow: 1,
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md
  },
  hint: { ...typography.role.bodySecondary, color: colors.status.danger },
  footer: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    textAlign: "center"
  },
  account: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm
  },
  accountText: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary
  }
});
