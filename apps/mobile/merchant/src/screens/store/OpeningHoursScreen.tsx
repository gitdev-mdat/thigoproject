import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { FieldMessage } from "../../components/FieldMessage";
import { Notice } from "../../components/Notice";
import { ScreenHeader } from "../../components/ScreenHeader";
import { TextField } from "../../components/TextField";
import { Toggle } from "../../components/Toggle";
import { ToggleRow } from "../../components/ToggleRow";
import type { Storefront } from "../../hooks/useStorefront";
import { saveOpeningHours } from "../../services/storefront";
import {
  DAY_LABELS,
  applyToAll,
  dayErrors,
  formatTimeInput,
  fromDrafts,
  overnightHint,
  toDrafts,
  weekError,
  type DayDraft
} from "../../utils/hours";
import type { Navigation, Notify } from "../routes";

type Props = { storefront: Storefront; nav: Navigation; notify: Notify };

/** Seven Monday-first days, or no hour limit at all. */
export function OpeningHoursScreen({ storefront, nav, notify }: Props) {
  const { bottom } = useSafeAreaInsets();
  const hours = storefront.store?.openingHours ?? null;
  const [unlimited, setUnlimited] = useState(hours === null);
  const [days, setDays] = useState<DayDraft[]>(() => toDrafts(hours));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const perDay = submitted && !unlimited ? dayErrors(days) : [];
  const week = submitted && !unlimited ? weekError(days) : undefined;

  const update = (index: number, patch: Partial<DayDraft>) => {
    setServerError("");
    setDays((current) =>
      current.map((day, at) => (at === index ? { ...day, ...patch } : day))
    );
  };

  const save = async () => {
    setSubmitted(true);
    if (!unlimited && (dayErrors(days).some(Boolean) || weekError(days)))
      return;
    setSaving(true);
    setServerError("");
    const result = await storefront.mutateStore(() =>
      saveOpeningHours(unlimited ? null : fromDrafts(days))
    );
    setSaving(false);
    if (!result.ok) return setServerError(result.message);
    notify("Đã lưu giờ mở cửa.");
    nav.back();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Giờ mở cửa"
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
          <Card>
            <ToggleRow
              prominent
              title="Không giới hạn giờ"
              description={
                unlimited
                  ? "Khách đặt được bất cứ lúc nào cửa hàng đang bật nhận đơn."
                  : "Tắt: khách chỉ đặt được trong giờ mở cửa bên dưới."
              }
              value={unlimited}
              disabled={saving}
              onChange={(value) => {
                setServerError("");
                setUnlimited(value);
              }}
            />
          </Card>

          {unlimited ? null : (
            <>
              <Text style={styles.help}>
                Giờ theo dạng 24 giờ, ví dụ 07:30. Nếu đóng cửa sau nửa đêm,
                nhập giờ đóng nhỏ hơn giờ mở (ví dụ 18:00 – 02:00).
              </Text>
              {days.map((day, index) => (
                <DayRow
                  key={DAY_LABELS[index]}
                  label={DAY_LABELS[index] ?? ""}
                  day={day}
                  error={perDay[index]}
                  disabled={saving}
                  onChange={(patch) => update(index, patch)}
                />
              ))}
              <Button
                label="Áp dụng giờ Thứ 2 cho tất cả các ngày"
                variant="secondary"
                disabled={saving}
                onPress={() => {
                  setServerError("");
                  setDays((current) => applyToAll(current, 0));
                }}
              />
              {week ? <FieldMessage error={week} /> : null}
            </>
          )}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: bottom + spacing.sm }]}>
          {serverError ? <Notice message={serverError} tone="danger" /> : null}
          {submitted && perDay.some(Boolean) ? (
            <Text style={styles.error} accessibilityRole="alert">
              Kiểm tra lại giờ của các ngày được đánh dấu.
            </Text>
          ) : null}
          <Button
            label="Lưu giờ mở cửa"
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

type DayRowProps = {
  label: string;
  day: DayDraft;
  error?: string | undefined;
  disabled: boolean;
  onChange: (patch: Partial<DayDraft>) => void;
};

function DayRow({ label, day, error, disabled, onChange }: DayRowProps) {
  const hint = overnightHint(day);
  return (
    <View style={[styles.day, error ? styles.dayInvalid : null]}>
      <View style={styles.dayHead}>
        <View style={styles.dayText}>
          <Text style={styles.dayLabel} accessibilityRole="header">
            {label}
          </Text>
          <Text style={styles.dayState}>
            {day.closed ? "Nghỉ cả ngày" : "Mở cửa"}
          </Text>
        </View>
        <Toggle
          value={!day.closed}
          disabled={disabled}
          label={`Mở cửa ${label}`}
          onValueChange={(open) => onChange({ closed: !open })}
        />
      </View>
      {day.closed ? null : (
        <>
          <View style={styles.times}>
            <View style={styles.time}>
              <TextField
                label="Mở lúc"
                accessibilityLabel={`${label}, giờ mở cửa`}
                value={day.open}
                placeholder="07:00"
                keyboardType="number-pad"
                maxLength={5}
                editable={!disabled}
                onChangeText={(value) =>
                  onChange({ open: formatTimeInput(value) })
                }
              />
            </View>
            <View style={styles.time}>
              <TextField
                label="Đóng lúc"
                accessibilityLabel={`${label}, giờ đóng cửa`}
                value={day.close}
                placeholder="21:00"
                keyboardType="number-pad"
                maxLength={5}
                editable={!disabled}
                onChangeText={(value) =>
                  onChange({ close: formatTimeInput(value) })
                }
              />
            </View>
          </View>
          {error ? (
            <FieldMessage error={error} />
          ) : hint ? (
            <Text style={styles.hint}>{hint}</Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  day: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.xs,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  dayInvalid: { borderColor: colors.status.danger },
  dayHead: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dayText: { flex: 1 },
  dayLabel: { ...typography.role.itemTitle, color: colors.text.primary },
  dayState: { ...typography.role.caption, color: colors.text.secondary },
  times: { flexDirection: "row", gap: spacing.sm },
  time: { flex: 1 },
  hint: { ...typography.role.bodySecondary, color: colors.status.info },
  error: { ...typography.role.bodySecondary, color: colors.status.danger },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  }
});
