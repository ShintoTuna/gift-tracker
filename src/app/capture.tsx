import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/theme/tokens";

export default function CaptureScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Capture</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: { color: colors.text, fontSize: 24 },
});
