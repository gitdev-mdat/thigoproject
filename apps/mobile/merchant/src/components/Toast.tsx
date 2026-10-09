import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { elevation, radius, spacing } from "@thigo/design-tokens";

import { Notice } from "./Notice";

export type ToastMessage = {
  id: number;
  message: string;
  tone: "success" | "warning" | "danger" | "info";
};

type Props = {
  toast: ToastMessage | null;
  onDismiss: () => void;
  /** Distance from the bottom of the parent, e.g. above the tab bar. */
  offset: number;
};

const TOAST_MS = 5000;

/** Short confirmation after a change; announced politely, dismissible. */
export function Toast({ toast, onDismiss, offset }: Props) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: offset }]}>
      <View style={styles.card}>
        <Notice
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onDismiss={onDismiss}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md
  },
  card: {
    borderRadius: radius.medium,
    // boxShadow renders on Android, iOS and web; adding elevation would draw a second shadow on Android.
    boxShadow: elevation.overlay.webShadow
  }
});
