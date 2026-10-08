import { StatusBar } from "expo-status-bar";

import { RootScreen } from "./src/screens/RootScreen";

export default function App() {
  return (
    <>
      <RootScreen />
      <StatusBar style="dark" />
    </>
  );
}
