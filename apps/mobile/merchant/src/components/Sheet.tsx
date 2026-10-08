import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { IconButton } from "./IconButton";
import { useKeyboardVisible } from "../hooks/useKeyboardVisible";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** While true, the sheet cannot be dismissed (a request is in flight). */
  locked?: boolean;
  children: ReactNode;
  /** Stable actions pinned under the scrollable content. */
  footer: ReactNode;
};

/**
 * Bottom sheet for a short, focused decision: titled, with an explicit close
 * button, backdrop tap and Android back as alternatives to each other.
 */
export function Sheet({
  visible,
  title,
  onClose,
  locked = false,
  children,
  footer
}: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const close = () => {
    if (!locked) onClose();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      {/* Edge-to-edge windows (the app and this Modal) are not resized for the
          keyboard on Android, so both platforms pad the content instead. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={[styles.frame, { paddingTop: top + spacing.lg }]}>
          <Pressable
            style={styles.scrim}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: (keyboardVisible ? 0 : bottom) + spacing.md }
            ]}
            accessibilityViewIsModal
          >
            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              <IconButton
                icon="close"
                label="Đóng"
                onPress={close}
                disabled={locked}
              />
            </View>
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            <View style={styles.footer}>{footer}</View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  frame: { flex: 1, justifyContent: "flex-end" },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface.inverse,
    opacity: 0.5
  },
  sheet: {
    maxHeight: "100%",
    backgroundColor: colors.surface.elevated,
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingTop: spacing.xs
  },
  title: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    flex: 1
  },
  body: { flexGrow: 0, flexShrink: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle
  }
});
