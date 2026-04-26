import { Link, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/theme/tokens";

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile: {id}</Text>
      <Link href={`/brainstorm/${id}`} style={styles.link}>
        brainstorm (modal)
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: "center",
  },
  title: { color: colors.text, fontSize: 24 },
  link: { color: colors.brass, fontSize: 15 },
});
