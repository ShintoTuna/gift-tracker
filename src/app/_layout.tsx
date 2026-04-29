import { CormorantGaramond_500Medium_Italic } from "@expo-google-fonts/cormorant-garamond";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useFonts } from "expo-font";
import { Redirect, Stack, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";

import { DevDock } from "@/components";
// IMPORTANT: importing `@/i18n` runs i18next's `init()` for its
// side effect. This must happen before any child component calls
// `useTranslation()`, which the static import order guarantees.
import {
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
} from "@/i18n";
import { convex } from "@/lib/convex";
import { requestPermissionsAndGetToken } from "@/lib/notifications";

import { api } from "../../convex/_generated/api";

// Hold the splash up until fonts are ready. Without this, the app
// boots in fallback fonts for a frame and then re-flows.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignored: setting splash behavior is best-effort and may have been
  // called already by another part of the lifecycle.
});

// Convex Auth tokens persist in expo-secure-store across launches on
// device. Web falls back to the provider default (memory/localStorage).
const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

// LanguageGate primes i18next from the user's persisted preference
// before unblocking the UI. Two-tier resolution:
//
//   1. AsyncStorage cache  — read on mount, applied immediately. The
//      app boots in the user's language with zero flicker even when
//      Convex hasn't resolved yet (offline, slow network).
//   2. Convex source-of-truth — when the userSettings query resolves,
//      its `preferredLanguage` (if set) overrides i18next, the cache
//      is refreshed, and any cross-device change propagates in.
//
// The gate renders `null` until step 1 completes (a few ms in
// practice). Step 2 happens in the background and never blocks.
function LanguageGate({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [cacheChecked, setCacheChecked] = useState(false);
  // userSettings.get tolerates being called pre-auth (returns null).
  const settings = useQuery(api.userSettings.get);

  // Step 1: read AsyncStorage cache on mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((cached) => {
        if (cancelled) return;
        if (cached && isSupportedLanguage(cached) && cached !== i18n.language) {
          void i18n.changeLanguage(cached);
        }
      })
      .catch(() => {
        // Best-effort; if the read fails we just stay on the device
        // locale until Convex resolves.
      })
      .finally(() => {
        if (!cancelled) setCacheChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [i18n]);

  // Step 2: when Convex resolves with a saved preference, apply it.
  useEffect(() => {
    const preferred = settings?.preferredLanguage;
    if (!preferred) return;
    if (!isSupportedLanguage(preferred)) return;
    if (preferred === i18n.language) return;
    void i18n.changeLanguage(preferred);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, preferred).catch(() => {});
  }, [settings?.preferredLanguage, i18n]);

  if (!cacheChecked) {
    return null;
  }
  return <>{children}</>;
}

// NotificationsRegistrar makes sure the device's Expo push token is
// kept current with the backend whenever the user has opted in. It's a
// silent worker — no UI — mounted only inside the auth-gated tree so
// `getCurrentUserId()` resolves cleanly.
//
// The component never prompts proactively. Permissions are requested
// the first time the user toggles the master switch in Settings; this
// component just covers the steady-state ("user already opted in,
// reinstalled the app, signed back in"). If the token's missing
// because permission was revoked, `requestPermissionsAndGetToken`
// surfaces null and we no-op rather than re-prompting.
function NotificationsRegistrar() {
  const prefs = useQuery(api.notifications.getNotificationPrefs);
  const registerToken = useMutation(api.notifications.registerToken);
  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (prefs === undefined || prefs === null) return;
    if (!prefs.enabled) return;
    if (Platform.OS !== "ios" && Platform.OS !== "android") return;
    let cancelled = false;
    void (async () => {
      const token = await requestPermissionsAndGetToken();
      if (cancelled || !token) return;
      if (registeredRef.current === token) return;
      try {
        await registerToken({
          token,
          platform: Platform.OS === "android" ? "android" : "ios",
        });
        registeredRef.current = token;
      } catch {
        // Best-effort; the next mount or settings flip will retry.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefs, registerToken]);

  return null;
}

// AuthGate redirects unauthenticated users to the (auth) route group,
// and conversely keeps signed-in users out of it. `useConvexAuth()` is
// what reads from the secure-store-backed token cache, so this is the
// single source of truth for "who is signed in".
function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const segments = useSegments();
  const inAuthGroup = segments[0] === "(auth)";

  if (isLoading) return null;
  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }
  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/" />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_500Medium_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ConvexAuthProvider
      client={convex}
      storage={
        Platform.OS === "ios" || Platform.OS === "android"
          ? secureStorage
          : undefined
      }
    >
      <LanguageGate>
        <AuthGate>
          <NotificationsRegistrar />
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="people/[id]" />
              <Stack.Screen
                name="people/[id]/edit"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="people/new"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="capture"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="idea/[id]"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="occasion/new"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="occasion/[id]"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="brainstorm/[personId]"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="settings"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen name="design-system" />
            </Stack>
            <DevDock />
          </View>
        </AuthGate>
      </LanguageGate>
    </ConvexAuthProvider>
  );
}
