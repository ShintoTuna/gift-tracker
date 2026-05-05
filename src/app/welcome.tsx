import { useMutation } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Btn } from "@/components";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../convex/_generated/api";

// Post-signup welcome. Three short bullets explain the loop —
// add people, capture ideas, get reminded — then a single brass
// CTA marks the flag and drops the user into the People tab. The
// screen is gated by `userSettings.hasSeenWelcome` in the AuthGate
// so it only shows once per account.
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const markSeen = useMutation(api.userSettings.markWelcomeSeen);
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    if (busy) return;
    setBusy(true);
    // Await the mutation before navigating. Two reasons:
    //   1. `void markSeen({})` left the promise unhandled — a
    //      rejection (network blip, transient auth context) bubbled
    //      to Hermes and could kill the JS engine, which the OS
    //      reports as a process termination with no Sentry event.
    //   2. Navigating before `hasSeenWelcome` propagates to the
    //      AuthGate's userSettings subscription causes the gate to
    //      bounce us straight back to /welcome ("not seen yet"),
    //      mounting + unmounting (tabs) in a tight loop. Awaiting
    //      means by the time we replace, the gate sees the updated
    //      flag.
    try {
      await markSeen({});
    } catch {
      // Couldn't persist (truly offline / server error). Drop the
      // user into the app anyway — the AuthGate will re-prompt the
      // welcome screen on next sign-in, which is acceptable.
    }
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.hero}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{t("welcome.title")}</Text>
        <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>
      </View>

      <View style={styles.steps}>
        <Step
          numeral="1"
          title={t("welcome.step1Title")}
          body={t("welcome.step1Body")}
        />
        <Step
          numeral="2"
          title={t("welcome.step2Title")}
          body={t("welcome.step2Body")}
        />
        <Step
          numeral="3"
          title={t("welcome.step3Title")}
          body={t("welcome.step3Body")}
        />
      </View>

      <View style={styles.actions}>
        <Text style={styles.recoveryNote}>{t("welcome.recoveryNote")}</Text>
        <Btn tone="primary" full onPress={onContinue} disabled={busy}>
          {t("welcome.cta")}
        </Btn>
      </View>
    </SafeAreaView>
  );
}

function Step({
  numeral,
  title,
  body,
}: {
  numeral: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumeral}>
        <Text style={styles.stepNumeralText}>{numeral}</Text>
      </View>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.xxl,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text3,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    lineHeight: 21,
  },
  steps: {
    gap: spacing.xl,
  },
  step: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-start",
  },
  stepNumeral: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumeralText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.brass,
  },
  stepText: {
    flex: 1,
    minWidth: 0,
  },
  stepTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  stepBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text2,
    lineHeight: 20,
  },
  actions: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  recoveryNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
});
