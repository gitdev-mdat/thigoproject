import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootScreen } from "./src/screens/RootScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <RootScreen />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
