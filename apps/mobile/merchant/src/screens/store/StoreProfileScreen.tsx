import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { Notice } from "../../components/Notice";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StoreProfileFields } from "../../components/store/StoreProfileFields";
import type { Storefront } from "../../hooks/useStorefront";
import { updateStore } from "../../services/storefront";
import {
  hasErrors,
  profileChanges,
  profileDraft,
  validateProfile,
  type StoreProfileDraft
} from "../../utils/storefront";
import type { Navigation, Notify } from "../routes";

type Props = { storefront: Storefront; nav: Navigation; notify: Notify };

/** Edit the store's name, type, address, phone and description. */
export function StoreProfileScreen({ storefront, nav, notify }: Props) {
  const { bottom } = useSafeAreaInsets();
  const store = storefront.store;
  const [draft, setDraft] = useState<StoreProfileDraft>(() =>
    profileDraft(store)
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const errors = submitted ? validateProfile(draft) : {};

  const save = async () => {
    if (!store) return;
    setSubmitted(true);
    if (hasErrors(validateProfile(draft))) return;
    const changes = profileChanges(draft, store);
    if (!Object.keys(changes).length) {
      notify("Không có thay đổi nào để lưu.", "info");
      return nav.back();
    }
    setSaving(true);
    setServerError("");
    const result = await storefront.mutateStore(() => updateStore(changes));
    setSaving(false);
    if (!result.ok) return setServerError(result.message);
    notify("Đã lưu thông tin cửa hàng.");
    nav.back();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Thông tin cửa hàng"
        onBack={nav.back}
        backDisabled={saving}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <StoreProfileFields
            draft={draft}
            errors={errors}
            editable={!saving}
            onChange={(patch) => {
              setDraft((current) => ({ ...current, ...patch }));
              setServerError("");
            }}
          />
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: bottom + spacing.sm }]}>
          {serverError ? <Notice message={serverError} tone="danger" /> : null}
          <Button
            label="Lưu thay đổi"
            loadingLabel="Đang lưu…"
            prominent
            loading={saving}
            onPress={() => void save()}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  }
});
