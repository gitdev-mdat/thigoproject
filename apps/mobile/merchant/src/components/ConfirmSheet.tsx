import type { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { colors, typography } from "@thigo/design-tokens";

import { Button } from "./Button";
import { Notice } from "./Notice";
import { Sheet } from "./Sheet";

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  loadingLabel: string;
  cancelLabel?: string;
  busy: boolean;
  error?: string | undefined;
  /** Destructive actions use the filled destructive style. */
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
};

/** Names the object and consequence before a meaningful change. */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  loadingLabel,
  cancelLabel = "Giữ nguyên",
  busy,
  error,
  destructive = false,
  onCancel,
  onConfirm,
  children
}: Props) {
  return (
    <Sheet
      visible={visible}
      title={title}
      onClose={onCancel}
      locked={busy}
      footer={
        <>
          <Button
            label={cancelLabel}
            variant="secondary"
            disabled={busy}
            onPress={onCancel}
            style={styles.action}
          />
          <Button
            label={confirmLabel}
            loadingLabel={loadingLabel}
            variant={destructive ? "destructive" : "primary"}
            loading={busy}
            onPress={onConfirm}
            style={styles.action}
          />
        </>
      }
    >
      <Text style={styles.body}>{body}</Text>
      {children}
      {error ? <Notice message={error} tone="danger" /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { ...typography.role.body, color: colors.text.primary },
  action: { flex: 1 }
});
