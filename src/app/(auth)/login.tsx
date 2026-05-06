import { useAuthActions } from "@convex-dev/auth/react";
import { makeRedirectUri } from "expo-auth-session";
import { router } from "expo-router";
import { openAuthSessionAsync } from "expo-web-browser";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { notify } from "@/lib/alerts";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

// Apple Sign-in on the web requires Sign in with Apple JS + a
// configured Service ID; until that's wired up we hide the button on
// web. Google + email OTP are enough to get users in.
const SHOW_APPLE_BUTTON = Platform.OS !== "web";

// localStorage key for remembering which OAuth provider initiated
// the redirect, so when the IdP returns `?code=...` to our origin
// we know which `signIn(provider, { code })` to call.
const PENDING_PROVIDER_KEY = "giftsmith.pendingOAuthProvider";

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

  // On web, the IdP returns the user to this same page with
  // `?code=...`. Pick that up on mount and finish the handshake.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const stashed = window.localStorage.getItem(PENDING_PROVIDER_KEY);
    if (!code || (stashed !== "apple" && stashed !== "google")) return;

    const provider = stashed as Provider;
    setPending(provider);
    void (async () => {
      try {
        await signIn(provider, { code });
        window.localStorage.removeItem(PENDING_PROVIDER_KEY);
        // Strip ?code so a refresh doesn't replay the exchange.
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        window.history.replaceState({}, "", url.toString());
      } catch (err) {
        window.localStorage.removeItem(PENDING_PROVIDER_KEY);
        notify(
          t("auth.errorTitle"),
          err instanceof Error ? err.message : String(err),
        );
        setPending(null);
      }
    })();
    // signIn / t are stable enough; rerunning on every render would
    // re-trigger the exchange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOAuth = async (provider: Provider) => {
    if (pending !== null) return;
    setPending(provider);
    try {
      const { redirect } = await signIn(provider, { redirectTo });
      if (!redirect) {
        throw new Error("No redirect URL returned");
      }
      if (Platform.OS === "web") {
        // Full-page redirect; the useEffect above will pick up the
        // `?code=...` return on the way back.
        window.localStorage.setItem(PENDING_PROVIDER_KEY, provider);
        window.location.assign(redirect.toString());
        return;
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
      notify(
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
        {SHOW_APPLE_BUTTON && (
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
        )}

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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("auth.continueWithEmail")}
          onPress={() => {
            if (pending !== null) return;
            // replace (not push) so the (auth) stack only ever holds
            // one screen — otherwise AuthGate's post-signin Redirect
            // has to dismiss two screens, which causes a useSegments
            // flicker and a Maximum-update-depth loop.
            router.replace("/(auth)/email");
          }}
          style={({ pressed }) => [
            styles.emailBtn,
            pressed && styles.emailPressed,
          ]}
        >
          <Text style={styles.emailText}>{t("auth.continueWithEmail")}</Text>
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
  emailBtn: {
    backgroundColor: "transparent",
    borderColor: colors.border2,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emailPressed: {
    backgroundColor: colors.surface,
  },
  emailText: {
    color: colors.text,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
});
