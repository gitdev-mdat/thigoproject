import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { DiscardChangesSheet } from "../../components/DiscardChangesSheet";
import { Notice } from "../../components/Notice";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StoreProfileFields } from "../../components/store/StoreProfileFields";
import { useLeaveGuard } from "../../hooks/useLeaveGuard";
import type { Storefront } from "../../hooks/useStorefront";
import { updateStore } from "../../services/storefront";
import { isDirty } from "../../utils/dirty";
import {
  hasErrors,
  profileChanges,
  profileDraft,
  validateProfile,
  type StoreProfileDraft
} from "../../utils/storefront";
import type { Navigation, Notify } from "../routes";
import { useKeyboardVisible } from "../../hooks/useKeyboardVisible";

type Props = { storefront: Storefront; nav: Navigation; notify: Notify };

/** Edit the store's name, type, address, phone and description. */
export function StoreProfileScreen({ storefront, nav, notify }: Props) {
  const { bottom } = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const store = storefront.store;
  const [initial] = useState<StoreProfileDraft>(() => profileDraft(store));
  const [draft, setDraft] = useState<StoreProfileDraft>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const errors = submitted ? validateProfile(draft) : {};
  const guard = useLeaveGuard({
    dirty: isDirty(initial, draft),
    busy: saving,
    nav
  });

  const save = async () => {
    if (!store) return;
    setSubmitted(true);
    if (hasErrors(validateProfile(draft))) return;
    const changes = profileChanges(draft, store);
    if (!Object.keys(changes).length) {
      notify("Không có thay đổi nào để lưu.", "info");
      return guard.leave();
    }
    setSaving(true);
    setServerError("");
    const result = await storefront.mutateStore(() => updateStore(changes));
    setSaving(false);
    if (!result.ok) return setServerError(result.message);
    notify("Đã lưu thông tin cửa hàng.");
    guard.leave();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Thông tin cửa hàng"
        onBack={nav.back}
        backDisabled={saving}
      />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
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
        <View
          style={[
            styles.footer,
            { paddingBottom: (keyboardVisible ? 0 : bottom) + spacing.sm }
          ]}
        >
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
      <DiscardChangesSheet
        visible={guard.confirming}
        onStay={guard.stay}
        onDiscard={guard.leave}
      />
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
