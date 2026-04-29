import { useAuthActions } from "@convex-dev/auth/react";
import { makeRedirectUri } from "expo-auth-session";
import { openAuthSessionAsync } from "expo-web-browser";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";

// Single-screen OAuth login. Apple is rendered first per Apple HIG;
// Google is the secondary option. Both go through the canonical Convex
// Auth + expo-auth-session web flow:
//
//   1. signIn(provider, { redirectTo })  → backend hands us an OAuth
//      authorization URL pointing at the IdP.
//   2. openAuthSessionAsync(url, redirectTo)  → in-app browser opens
//      the IdP, user consents, IdP redirects back to redirectTo with
//      ?code=... in the URL.
//   3. signIn(provider, { code })  → backend exchanges the code for
//      tokens and creates/updates the user via createOrUpdateUser.
//
// Tokens land in expo-secure-store via ConvexAuthProvider, so the
// next launch is silent.
type Provider = "apple" | "google";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuthActions();
  const [pending, setPending] = useState<Provider | null>(null);

  const redirectTo = makeRedirectUri();

  const handleOAuth = async (provider: Provider) => {
    if (pending !== null) return;
    setPending(provider);
    try {
      const { redirect } = await signIn(provider, { redirectTo });
      if (!redirect) {
        throw new Error("No redirect URL returned");
      }
      const result = await openAuthSessionAsync(redirect.toString(), redirectTo);
      if (result.type !== "success") {
        // User cancelled or browser dismissed — silent return.
        setPending(null);
        return;
      }
      const code = new URL(result.url).searchParams.get("code");
      if (!code) {
        throw new Error("No code returned from provider");
      }
      await signIn(provider, { code });
      // AuthGate will redirect into (tabs) once isAuthenticated flips.
    } catch (err) {
      Alert.alert(
        t("auth.errorTitle"),
        err instanceof Error ? err.message : String(err),
      );
      setPending(null);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Image
          source={require("../../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{t("auth.welcome.title")}</Text>
        <Text style={styles.subtitle}>{t("auth.welcome.subtitle")}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("auth.continueWithApple")}
          onPress={() => handleOAuth("apple")}
          style={({ pressed }) => [
            styles.appleBtn,
            pressed && styles.applePressed,
          ]}
        >
          {pending === "apple" ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.appleText}>
              {"  "}
              {t("auth.continueWithApple")}
            </Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("auth.continueWithGoogle")}
          onPress={() => handleOAuth("google")}
          style={({ pressed }) => [
            styles.googleBtn,
            pressed && styles.googlePressed,
          ]}
        >
          {pending === "google" ? (
            <ActivityIndicator color="#1F1F1F" />
          ) : (
            <Text style={styles.googleText}>
              {"G  "}
              {t("auth.continueWithGoogle")}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 36,
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
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  appleBtn: {
    backgroundColor: "#000000",
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  applePressed: {
    backgroundColor: "#1A1A1A",
  },
  appleText: {
    color: "#FFFFFF",
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
  googleBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  googlePressed: {
    backgroundColor: "#F2F2F2",
  },
  googleText: {
    color: "#1F1F1F",
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
});
