import { StyleSheet, Text, View } from "react-native";

import { APP_NAME } from "../utils/app-metadata";

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>THIGO</Text>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.body}>
        Foundation ready for the first real feature.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#F4F7F5"
  },
  eyebrow: {
    color: "#16794A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 3
  },
  title: {
    marginTop: 8,
    color: "#10231A",
    fontSize: 48,
    fontWeight: "800"
  },
  body: {
    marginTop: 12,
    color: "#496257",
    fontSize: 17
  }
});
