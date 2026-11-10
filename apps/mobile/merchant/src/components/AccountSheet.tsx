import { StyleSheet, Text } from "react-native";
import { colors, typography } from "@thigo/design-tokens";

import { Button } from "./Button";
import { Sheet } from "./Sheet";

type Props = {
  visible: boolean;
  phone?: string | undefined;
  storeName?: string | undefined;
  busy: boolean;
  onClose: () => void;
  onLogout: () => void;
};

/** Account details and a confirmed log out, so a stray tap mid-shift is safe. */
export function AccountSheet({
  visible,
  phone,
  storeName,
  busy,
  onClose,
  onLogout
}: Props) {
  return (
    <Sheet
      visible={visible}
      title="Tài khoản"
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Button
            label="Ở lại"
            variant="secondary"
            disabled={busy}
            onPress={onClose}
            style={styles.action}
          />
          <Button
            label="Đăng xuất"
            loadingLabel="Đang đăng xuất…"
            variant="destructive"
            loading={busy}
            onPress={onLogout}
            style={styles.action}
          />
        </>
      }
    >
      {phone ? (
        <Text style={styles.body}>
          Đang đăng nhập với {phone}
          {storeName ? ` cho ${storeName}` : ""}.
        </Text>
      ) : null}
      <Text style={styles.help}>
        Sau khi đăng xuất, thiết bị này sẽ không nhận đơn mới cho đến khi đăng
        nhập lại.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { ...typography.role.body, color: colors.text.primary },
  help: { ...typography.role.bodySecondary, color: colors.text.secondary },
  action: { flex: 1 }
});
