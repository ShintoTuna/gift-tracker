import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { Btn } from "./Btn";
import { colors, fonts, spacing } from "@/theme/tokens";

type Props = {
  error: unknown;
  resetError: () => void;
};

// Full-screen fallback rendered by the Sentry GlobalErrorBoundary
// when a fatal JS error escapes the render tree. The error has
// already been captured to Sentry by the time this mounts; the only
// job here is to give the user a way out other than force-quitting.
export function ErrorFallback({ resetError }: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("errors.crashTitle")}</Text>
        <Text style={styles.body}>{t("errors.crashBody")}</Text>
        <Btn tone="primary" onPress={resetError}>
          {t("errors.tryAgain")}
        </Btn>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
    textAlign: "center",
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text2,
    textAlign: "center",
    lineHeight: 22,
  },
});
