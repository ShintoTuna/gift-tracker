import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { api } from "../../../convex/_generated/api";
import { colors, spacing } from "@/theme/tokens";

// Wire-test screen: proves the Convex client is reachable, the schema
// is deployed, and the api codegen is in scope. Result is `undefined`
// while the subscription is loading and `[]` once the empty `people`
// table responds.
export default function PeopleScreen() {
  const people = useQuery(api.people.list);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>People</Text>
      <Text style={styles.body}>
        loaded {people?.length ?? 0} people
      </Text>
      <Link href="/people/dev-1" style={styles.link}>
        go to profile
      </Link>
      <Link href="/capture" style={styles.link}>
        capture (modal)
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
  title: { color: colors.text, fontSize: 32 },
  body: { color: colors.text2, fontSize: 15 },
  link: { color: colors.brass, fontSize: 15 },
});
