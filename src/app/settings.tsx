import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card, Label, NavBar, Pill, ScreenTitle } from "@/components";
import { DEFAULT_CURRENCY } from "@/lib/settings";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../convex/_generated/api";

const CURRENCIES: { code: string; label: string }[] = [
  { code: "EUR", label: "EUR €" },
  { code: "USD", label: "USD $" },
  { code: "GBP", label: "GBP £" },
  { code: "JPY", label: "JPY ¥" },
];

// Modal-presented Settings screen. For now: just the default
// currency. Account / Notifications / About sections slot in here
// as the corresponding features land.
export default function SettingsScreen() {
  const settings = useQuery(api.userSettings.get);
  const setDefaultCurrency = useMutation(api.userSettings.setDefaultCurrency);

  const currentCurrency = settings?.defaultCurrency ?? DEFAULT_CURRENCY;

  return (
    <View style={styles.root}>
      <NavBar
        title="Settings"
        leading="close"
        onLeadingPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle sub="Things you can change">Settings</ScreenTitle>

        <View style={styles.section}>
          <Label style={styles.sectionLabel}>Preferences</Label>
          <Card>
            <Text style={styles.fieldLabel}>Default currency</Text>
            <Text style={styles.fieldHint}>
              Used when you save a price on a captured idea.
            </Text>
            <View style={styles.choiceRow}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    if (c.code !== currentCurrency) {
                      setDefaultCurrency({ currency: c.code });
                    }
                  }}
                  hitSlop={4}
                >
                  <Pill tone={c.code === currentCurrency ? "brass" : "default"}>
                    {c.label}
                  </Pill>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  fieldHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    marginTop: 4,
    lineHeight: 18,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
