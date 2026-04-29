import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card, Label, NavBar, Pill, ScreenTitle } from "@/components";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type Language,
} from "@/i18n";
import { DEFAULT_CURRENCY, usePreferredLanguage } from "@/lib/settings";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../convex/_generated/api";

const CURRENCIES: { code: string; label: string }[] = [
  { code: "EUR", label: "EUR €" },
  { code: "USD", label: "USD $" },
  { code: "GBP", label: "GBP £" },
  { code: "JPY", label: "JPY ¥" },
];

// Modal-presented Settings screen. For now: default currency and
// preferred language. Account / Notifications / About sections slot
// in here as the corresponding features land.
export default function SettingsScreen() {
  const { t } = useTranslation();
  const settings = useQuery(api.userSettings.get);
  const setDefaultCurrency = useMutation(api.userSettings.setDefaultCurrency);
  const { language: currentLanguage, setLanguage } = usePreferredLanguage();

  const currentCurrency = settings?.defaultCurrency ?? DEFAULT_CURRENCY;

  return (
    <View style={styles.root}>
      <NavBar
        title={t("settings.title")}
        leading="close"
        onLeadingPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle sub={t("settings.subtitle")}>
          {t("settings.title")}
        </ScreenTitle>

        <View style={styles.section}>
          <Label style={styles.sectionLabel}>{t("settings.preferences")}</Label>
          <Card>
            <Text style={styles.fieldLabel}>{t("settings.defaultCurrency")}</Text>
            <Text style={styles.fieldHint}>
              {t("settings.defaultCurrencyHint")}
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

          <View style={styles.cardSpacer} />

          <Card>
            <Text style={styles.fieldLabel}>{t("settings.language")}</Text>
            <Text style={styles.fieldHint}>{t("settings.languageHint")}</Text>
            <View style={styles.choiceRow}>
              {SUPPORTED_LANGUAGES.map((code: Language) => (
                <Pressable
                  key={code}
                  onPress={() => {
                    if (code !== currentLanguage) {
                      void setLanguage(code);
                    }
                  }}
                  hitSlop={4}
                >
                  <Pill tone={code === currentLanguage ? "brass" : "default"}>
                    {LANGUAGE_LABELS[code]}
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
  cardSpacer: {
    height: spacing.md,
  },
});
