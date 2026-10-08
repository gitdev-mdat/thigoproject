import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text
} from "react-native";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { useAuthSession } from "../hooks/useAuthSession";
import { HomeScreen } from "./HomeScreen";
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
  if (session.step === "authenticated") return <HomeScreen session={session} />;
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
  help: { ...typography.role.bodySecondary, color: colors.text.secondary }
});
