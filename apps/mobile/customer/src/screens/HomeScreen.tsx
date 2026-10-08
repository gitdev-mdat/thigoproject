import { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { colors } from "@thigo/design-tokens";

import { TabBar, type HomeTab as Tab } from "../components/home/TabBar";
import type { AuthSession } from "../hooks/useAuthSession";
import { useCustomerHome } from "../hooks/useCustomerHome";
import { AccountTab } from "./home/AccountTab";
import { HomeTab } from "./home/HomeTab";
import { OrdersTab } from "./home/OrdersTab";

type Props = { session: AuthSession };

export function HomeScreen({ session }: Props) {
  const [tab, setTab] = useState<Tab>("home");
  const data = useCustomerHome();
  const initial = data.home?.greetingName?.charAt(0).toUpperCase() ?? "K";
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        {tab === "home" ? (
          <HomeTab
            data={data}
            initial={initial}
            onOpenOrders={() => setTab("orders")}
            onOpenAccount={() => setTab("account")}
          />
        ) : tab === "orders" ? (
          <OrdersTab data={data} />
        ) : (
          <AccountTab session={session} initial={initial} />
        )}
      </View>
      <TabBar active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.primary },
  content: { flex: 1 }
});
