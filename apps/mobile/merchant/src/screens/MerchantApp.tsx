import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@thigo/design-tokens";

import { Button } from "../components/Button";
import { StatePanel } from "../components/StatePanel";
import type { AuthSession } from "../hooks/useAuthSession";
import { useStorefront } from "../hooks/useStorefront";
import { MerchantShell } from "./MerchantShell";
import { StoreSetupScreen } from "./setup/StoreSetupScreen";

type Props = { session: AuthSession };

/** After login: first-time setup when there is no store, otherwise the app. */
export function MerchantApp({ session }: Props) {
  const storefront = useStorefront();
  const { top, bottom } = useSafeAreaInsets();
  const [created, setCreated] = useState(false);
  const frame = [styles.screen, { paddingTop: top, paddingBottom: bottom }];

  if (storefront.phase === "unauthorized")
    return (
      <View style={[frame, styles.center]}>
        <StatusBar style="dark" />
        <StatePanel
          title="Phiên đăng nhập đã hết hạn"
          body="Đăng nhập lại để tiếp tục quản lý cửa hàng trên thiết bị này."
        >
          <Button
            label="Đăng nhập lại"
            loadingLabel="Đang đăng xuất…"
            loading={session.busy}
            onPress={() => void session.logout()}
          />
        </StatePanel>
      </View>
    );

  if (!storefront.overview) {
    if (storefront.phase === "error")
      return (
        <View style={[frame, styles.center]}>
          <StatusBar style="dark" />
          <StatePanel
            title="Chưa tải được cửa hàng"
            body={`${storefront.error} Kiểm tra kết nối mạng rồi thử lại.`}
          >
            <Button label="Thử lại" onPress={storefront.retry} />
            <Button
              label="Đăng xuất"
              variant="tertiary"
              disabled={session.busy}
              onPress={() => void session.logout()}
            />
          </StatePanel>
        </View>
      );
    return (
      <View style={[frame, styles.center]}>
        <StatusBar style="dark" />
        <ActivityIndicator
          color={colors.brand.primary}
          accessibilityLabel="Đang tải cửa hàng"
        />
        <Text style={styles.help}>Đang tải cửa hàng…</Text>
      </View>
    );
  }

  if (!storefront.store)
    return (
      <StoreSetupScreen
        session={session}
        storefront={storefront}
        onCreated={() => setCreated(true)}
      />
    );

  return (
    <MerchantShell
      session={session}
      storefront={storefront}
      justCreated={created}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.secondary },
  center: { justifyContent: "center", alignItems: "stretch", gap: spacing.sm },
  help: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary,
    textAlign: "center"
  }
});
