import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { Button } from "../components/Button";
import { useAuthSession } from "../hooks/useAuthSession";
import { CustomerApp } from "./CustomerApp";
import { LoginScreen } from "./LoginScreen";

export function RootScreen() {
  const session = useAuthSession();
  if (session.step === "restoring")
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          accessibilityLabel="Đang khôi phục phiên đăng nhập"
          color={colors.brand.primary}
        />
        <Text style={styles.help}>Đang kiểm tra phiên đăng nhập…</Text>
      </SafeAreaView>
    );
  if (session.step === "restoreFailed")
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.panel}>
          <Text style={styles.title} accessibilityRole="header">
            Chưa kết nối được THIGO
          </Text>
          <Text style={styles.help}>
            Kiểm tra kết nối mạng rồi thử lại. Bạn vẫn đang đăng nhập.
          </Text>
          <Button
            label="Thử lại"
            style={styles.retry}
            onPress={() => void session.retryRestore()}
          />
        </View>
      </SafeAreaView>
    );
  if (session.step === "authenticated")
    return <CustomerApp session={session} />;
  return <LoginScreen session={session} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary
  },
  // SafeAreaView replaces its own padding with insets on iOS, so the gutter lives here.
  panel: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  title: {
    ...typography.role.sectionTitle,
    color: colors.text.primary,
    textAlign: "center"
  },
  help: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    textAlign: "center"
  },
  retry: { alignSelf: "stretch", marginTop: spacing.xs }
});
