import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
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
import { Card } from "../../components/Card";
import { Notice } from "../../components/Notice";
import { StatePanel } from "../../components/StatePanel";
import { TextField } from "../../components/TextField";
import { StoreProfileFields } from "../../components/store/StoreProfileFields";
import type { AuthSession } from "../../hooks/useAuthSession";
import { attempt } from "../../services/api";
import {
  activateApplication,
  fetchMyApplication,
  saveApplication,
  submitApplication
} from "../../services/application";
import type { MyApplication } from "../../types/application";
import {
  applicantView,
  applicationDraft,
  applicationInput,
  eventLabel,
  formatDateTime,
  validateApplication,
  type ApplicantView,
  type ApplicationDraft,
  type ApplicationErrors
} from "../../utils/application";
import { formatPhone, maskPhone } from "../../utils/phone";
import {
  hasErrors,
  storeCategoryLabel,
  toLocalPhone
} from "../../utils/storefront";

type Props = { session: AuthSession };
type Mode = "status" | "form" | "review";

const HERO: Record<ApplicantView, { title: string; body: string }> = {
  intro: {
    title: "Trở thành đối tác THIGO",
    body: "Đưa món của quán bạn đến khách quanh khu vực. Hồ sơ chỉ cần vài thông tin cơ bản."
  },
  draft: {
    title: "Hồ sơ đang soạn",
    body: "Hồ sơ đã được lưu. Kiểm tra lại rồi gửi để THIGO xem xét."
  },
  pending: {
    title: "Hồ sơ đang chờ duyệt",
    body: "THIGO đang xem hồ sơ của bạn. Kết quả sẽ hiện ngay tại đây."
  },
  changes: {
    title: "Cần bổ sung hồ sơ",
    body: "THIGO cần bạn chỉnh sửa vài thông tin trước khi duyệt."
  },
  rejected: {
    title: "Hồ sơ chưa được duyệt",
    body: "Bạn có thể xem lý do và nộp hồ sơ mới khi đã sẵn sàng."
  },
  invited: {
    title: "THIGO đã duyệt cửa hàng của bạn",
    body: "Kích hoạt tài khoản đối tác để bắt đầu thiết lập thực đơn và mở bán."
  },
  merchant: {
    title: "Đang mở cửa hàng của bạn",
    body: "Tài khoản đối tác đã sẵn sàng."
  }
};

const FORM_HERO = {
  title: "Thông tin cửa hàng",
  body: "Chỉ những thông tin THIGO cần để xem xét. Ảnh và thực đơn thêm sau khi được duyệt."
};
const REVIEW_HERO = {
  title: "Xem lại hồ sơ",
  body: "Sau khi gửi, bạn chỉ sửa được khi THIGO yêu cầu bổ sung."
};

/**
 * The partner application for a signed-in phone without the MERCHANT role.
 * Every state comes from the API; nothing here grants access by itself.
 */
export function ApplicantScreen({ session }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const [mine, setMine] = useState<MyApplication>();
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<Mode>("status");
  const [draft, setDraft] = useState<ApplicationDraft>(() =>
    applicationDraft(null)
  );
  const [errors, setErrors] = useState<ApplicationErrors>({});
  const [busy, setBusy] = useState<
    "" | "load" | "save" | "submit" | "activate"
  >("load");
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "danger";
  }>();
  const [accountOpen, setAccountOpen] = useState(false);
  const { refreshAccess } = session;

  const load = useCallback(async () => {
    setBusy("load");
    setLoadError("");
    setMessage(undefined);
    const result = await attempt(fetchMyApplication);
    setBusy("");
    if (!result.ok) {
      if (result.status === 401) return void session.logout();
      return setLoadError(result.message);
    }
    setMine(result.value);
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const view = mine ? applicantView(mine) : null;

  // An approval already granted the role: open the store.
  useEffect(() => {
    if (view === "merchant") void refreshAccess();
  }, [view, refreshAccess]);

  // Android back leaves the form or review before it leaves the app.
  useEffect(() => {
    if (mode === "status") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setMode(mode === "review" ? "form" : "status");
        return true;
      }
    );
    return () => subscription.remove();
  }, [mode]);

  const openForm = () => {
    setDraft(applicationDraft(mine?.application ?? null));
    setErrors({});
    setMessage(undefined);
    setMode("form");
  };

  const change = (patch: Partial<ApplicationDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (hasErrors(errors)) setErrors(validateApplication(next));
  };

  /** Saves the draft; returns true when the server accepted it. */
  const save = async (): Promise<boolean> => {
    const found = validateApplication(draft);
    setErrors(found);
    if (hasErrors(found)) return false;
    setBusy("save");
    setMessage(undefined);
    const result = await attempt(() =>
      saveApplication(applicationInput(draft))
    );
    setBusy("");
    if (!result.ok) {
      setMessage({ text: result.message, tone: "danger" });
      return false;
    }
    setMine(result.value);
    return true;
  };

  const submit = async () => {
    setBusy("submit");
    setMessage(undefined);
    const result = await attempt(submitApplication);
    setBusy("");
    if (!result.ok) return setMessage({ text: result.message, tone: "danger" });
    setMine(result.value);
    setMode("status");
    setMessage({
      text: "Đã gửi hồ sơ. THIGO sẽ phản hồi tại đây.",
      tone: "success"
    });
  };

  const activate = async () => {
    setBusy("activate");
    setMessage(undefined);
    const result = await attempt(activateApplication);
    setBusy("");
    if (!result.ok) return setMessage({ text: result.message, tone: "danger" });
    setMine(result.value);
  };

  const phone = session.user ? maskPhone(session.user.phone) : undefined;
  const hero =
    mode === "form"
      ? FORM_HERO
      : mode === "review"
        ? REVIEW_HERO
        : view
          ? HERO[view]
          : HERO.intro;

  let content;
  if (!mine)
    content = loadError ? (
      <StatePanel title="Chưa tải được hồ sơ" body={loadError}>
        <Button label="Thử lại" onPress={() => void load()} />
      </StatePanel>
    ) : (
      <View style={styles.loading}>
        <ActivityIndicator
          color={colors.brand.primary}
          accessibilityLabel="Đang tải hồ sơ"
        />
      </View>
    );
  else if (mode === "form")
    content = (
      <>
        <StoreProfileFields
          draft={draft}
          errors={errors}
          editable={!busy}
          onChange={change}
        />
        <TextField
          label="Người liên hệ"
          placeholder="Họ và tên chủ quán"
          value={draft.contactName}
          onChangeText={(contactName) => change({ contactName })}
          maxLength={80}
          autoCapitalize="words"
          editable={!busy}
          error={errors.contactName}
          helper="THIGO gọi người này khi cần trao đổi về hồ sơ."
        />
        {message ? <Notice message={message.text} tone={message.tone} /> : null}
        <Button
          label="Xem lại hồ sơ"
          loadingLabel="Đang lưu…"
          prominent
          loading={busy === "save"}
          onPress={() => void save().then((ok) => ok && setMode("review"))}
        />
        <Button
          label="Lưu nháp"
          variant="secondary"
          disabled={!!busy}
          onPress={() =>
            void save().then((ok) => {
              if (!ok) return;
              setMode("status");
              setMessage({ text: "Đã lưu hồ sơ nháp.", tone: "success" });
            })
          }
        />
        <Button
          label="Quay lại"
          variant="tertiary"
          disabled={!!busy}
          onPress={() => setMode("status")}
        />
      </>
    );
  else if (mode === "review" && mine.application)
    content = (
      <>
        <Summary mine={mine} />
        <Notice message="Hồ sơ không làm thay đổi tài khoản của bạn cho đến khi THIGO duyệt." />
        {message ? <Notice message={message.text} tone={message.tone} /> : null}
        <Button
          label="Gửi hồ sơ"
          loadingLabel="Đang gửi…"
          prominent
          loading={busy === "submit"}
          onPress={() => void submit()}
        />
        <Button
          label="Sửa thông tin"
          variant="secondary"
          disabled={!!busy}
          onPress={() => setMode("form")}
        />
      </>
    );
  else
    content = (
      <StatusContent
        mine={mine}
        view={view!}
        busy={busy}
        message={message}
        onStart={openForm}
        onReview={() => setMode("review")}
        onRefresh={() => void load()}
        onActivate={() => void activate()}
      />
    );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, { paddingTop: top + spacing.lg }]}>
            <BrandMark role="Đối tác" tone="dark" />
            <View style={styles.heroText}>
              <Text style={styles.title} accessibilityRole="header">
                {hero.title}
              </Text>
              <Text style={styles.body}>{hero.body}</Text>
            </View>
          </View>
          <View style={[styles.sheet, { paddingBottom: bottom + spacing.xl }]}>
            {content}
            <View style={styles.account}>
              <Text style={styles.accountText}>
                {phone ? `Đang đăng nhập: ${phone}` : "Đang đăng nhập"}
              </Text>
              <Button
                label="Đăng xuất"
                variant="tertiary"
                disabled={!!busy && busy !== "load"}
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

function StatusContent({
  mine,
  view,
  busy,
  message,
  onStart,
  onReview,
  onRefresh,
  onActivate
}: {
  mine: MyApplication;
  view: ApplicantView;
  busy: string;
  message: { text: string; tone: "success" | "danger" } | undefined;
  onStart: () => void;
  onReview: () => void;
  onRefresh: () => void;
  onActivate: () => void;
}) {
  const application = mine.application;
  return (
    <>
      {message ? <Notice message={message.text} tone={message.tone} /> : null}
      {view === "intro" ? (
        <>
          <Card title="Đăng ký gồm 3 bước">
            <Step number={1} text="Gửi thông tin cửa hàng và người liên hệ." />
            <Step number={2} text="THIGO xem xét và phản hồi trong ứng dụng." />
            <Step
              number={3}
              text="Được duyệt: thêm ảnh, thực đơn, giờ mở cửa rồi mở bán."
            />
          </Card>
          <Button
            label="Đăng ký trở thành đối tác"
            prominent
            onPress={onStart}
          />
        </>
      ) : null}
      {view === "changes" && application?.reviewNote ? (
        <Notice
          message={`THIGO cần bổ sung: ${application.reviewNote}`}
          tone="warning"
        />
      ) : null}
      {view === "rejected" && application?.reviewNote ? (
        <Notice message={`Lý do: ${application.reviewNote}`} tone="danger" />
      ) : null}
      {application && view !== "intro" ? <Summary mine={mine} /> : null}
      {view === "draft" ? (
        <>
          <Button label="Xem lại và gửi" prominent onPress={onReview} />
          <Button label="Sửa hồ sơ" variant="secondary" onPress={onStart} />
        </>
      ) : null}
      {view === "changes" ? (
        <Button label="Sửa và gửi lại" prominent onPress={onStart} />
      ) : null}
      {view === "rejected" && mine.canStartNew ? (
        <Button label="Nộp hồ sơ mới" variant="secondary" onPress={onStart} />
      ) : null}
      {view === "pending" ? (
        <Button
          label="Kiểm tra trạng thái"
          loadingLabel="Đang kiểm tra…"
          variant="secondary"
          loading={busy === "load"}
          onPress={onRefresh}
        />
      ) : null}
      {view === "invited" ? (
        <Button
          label="Kích hoạt tài khoản đối tác"
          loadingLabel="Đang kích hoạt…"
          prominent
          loading={busy === "activate"}
          onPress={onActivate}
        />
      ) : null}
      {mine.history.length ? (
        <Card title="Lịch sử hồ sơ">
          {[...mine.history].reverse().map((event, index) => (
            <View key={`${event.createdAt}-${index}`} style={styles.event}>
              <Text style={styles.eventTitle}>{eventLabel(event)}</Text>
              <Text style={styles.caption}>
                {formatDateTime(event.createdAt)}
              </Text>
              {event.note ? (
                <Text style={styles.eventNote}>{event.note}</Text>
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}
    </>
  );
}

function Summary({ mine }: { mine: MyApplication }) {
  const application = mine.application!;
  return (
    <Card
      title={application.storeName}
      subtitle={`Mã hồ sơ ${application.code}`}
    >
      <Row
        label="Loại cửa hàng"
        value={storeCategoryLabel(application.category)}
      />
      <Row label="Địa chỉ" value={application.addressLine} />
      <Row
        label="Điện thoại quán"
        value={formatPhone(toLocalPhone(application.contactPhone))}
      />
      <Row label="Người liên hệ" value={application.contactName} />
      {application.description ? (
        <Row label="Giới thiệu" value={application.description} />
      ) : null}
      {application.submittedAt ? (
        <Row
          label="Đã gửi lúc"
          value={formatDateTime(application.submittedAt)}
        />
      ) : null}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.caption}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
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
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md
  },
  loading: { paddingVertical: spacing.xxl, alignItems: "center" },
  step: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primarySubtle,
    alignItems: "center",
    justifyContent: "center"
  },
  stepNumberText: { ...typography.role.label, color: colors.brand.primary },
  stepText: {
    ...typography.role.body,
    color: colors.text.primary,
    flex: 1
  },
  row: { gap: spacing.xxs },
  rowValue: { ...typography.role.body, color: colors.text.primary },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  event: {
    gap: spacing.xxs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle
  },
  eventTitle: { ...typography.role.label, color: colors.text.primary },
  eventNote: { ...typography.role.bodySecondary, color: colors.text.secondary },
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
