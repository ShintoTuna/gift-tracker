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
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, View } from "react-native";

import { ConnectionBanner, DevDock, ErrorFallback } from "@/components";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { colors } from "@/theme/tokens";
// IMPORTANT: importing `@/i18n` runs i18next's `init()` for its
// side effect. This must happen before any child component calls
// `useTranslation()`, which the static import order guarantees.
import {
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
} from "@/i18n";
import { convex } from "@/lib/convex";
import { requestPermissionsAndGetToken } from "@/lib/notifications";
import { GlobalErrorBoundary, initSentry, wrap } from "@/lib/sentry";

import { api } from "../../convex/_generated/api";

// Init Sentry as a module side-effect so it's live before any
// component renders and can capture errors thrown during the very
// first frame. No-ops when EXPO_PUBLIC_SENTRY_DSN is unset, or when
// the user has opted out (mirrored to AsyncStorage).
void initSentry();

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

// React Navigation defaults to a light theme whose `background` is
// `rgb(242, 242, 242)`. react-native-screens paints that color on the
// screen wrapper, which leaks through as gray gutters on web around
// the centered desktop column. Pin the navigation theme's surface
// colors to the app bg so every Stack (outer, (auth), (tabs), etc.)
// renders against the same dark surface without per-screen overrides.
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
  },
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

// `useSegments()` returns the static template names of the active
// route, so dynamic params come back as e.g. "[id]". The screens
// listed below all opt into `presentation: "modal"` in the root
// Stack — keep the two lists in sync if a new modal route lands.
function isModalRoute(segments: string[]): boolean {
  const [s0, s1, s2] = segments;
  if (s0 === "capture" || s0 === "settings") return true;
  if (s0 === "occasion" || s0 === "brainstorm") return true;
  if (s0 === "people" && s1 === "new") return true;
  if ((s0 === "people" || s0 === "idea") && s2 === "edit") return true;
  return false;
}

// AuthGate redirects unauthenticated users to the (auth) route group,
// and conversely keeps signed-in users out of it. `useConvexAuth()` is
// what reads from the secure-store-backed token cache, so this is the
// single source of truth for "who is signed in". A second-stage gate
// routes signed-in users through /welcome the first time they sign up.
function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const settings = useQuery(api.userSettings.get);
  const segments = useSegments();
  const inAuthGroup = segments[0] === "(auth)";
  const inWelcome = segments[0] === "welcome";

  if (isLoading) return null;
  if (!isAuthenticated) {
    if (!inAuthGroup) return <Redirect href="/(auth)/login" />;
    return <>{children}</>;
  }

  // Authenticated. The welcome gate needs `settings` resolved; while
  // the query is in-flight (`undefined`) we hold rendering rather
  // than risk a flash of the tabs followed by a redirect to /welcome.
  if (settings === undefined) return null;
  const hasSeenWelcome = settings?.hasSeenWelcome === true;

  if (inAuthGroup) {
    return <Redirect href={hasSeenWelcome ? "/" : "/welcome"} />;
  }
  if (!hasSeenWelcome && !inWelcome) {
    return <Redirect href="/welcome" />;
  }
  if (hasSeenWelcome && inWelcome) {
    return <Redirect href="/" />;
  }
  return <>{children}</>;
}

function RootLayout() {
  const isDesktop = useBreakpoint() === "desktop";
  const segments = useSegments();
  // Modal routes break out of the desktop frame: the 832px-wide
  // shell with gray gutters reads as "an app window" for tab views
  // (sidebar + content), but on a modal the gutters look like
  // dead space because the sidebar isn't there to balance them.
  // When a modal route is focused, we drop the maxWidth so the
  // dark frame fills the viewport — gray gutters return when the
  // modal dismisses back to a tab.
  const onModalRoute = isModalRoute(segments);
  const wideFrame = isDesktop && !onModalRoute;
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
    <GlobalErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
    >
      <ConvexAuthProvider
        client={convex}
        storage={
          Platform.OS === "ios" || Platform.OS === "android"
            ? secureStorage
            : undefined
        }
      >
        <ThemeProvider value={navTheme}>
        <LanguageGate>
          <AuthGate>
            <NotificationsRegistrar />
            <View style={frameStyles.outer}>
            <View
              style={[
                frameStyles.inner,
                wideFrame ? frameStyles.innerDesktop : null,
              ]}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                  // At desktop, every screen renders inside a
                  // centered 640px column so forms and lists stop
                  // stretching across the wide frame. The (tabs)
                  // screen below opts out so the sidebar can use
                  // the full frame width.
                  contentStyle: isDesktop
                    ? {
                        width: "100%",
                        maxWidth: 600,
                        alignSelf: "center",
                        backgroundColor: colors.bg,
                      }
                    : undefined,
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen
                  name="(tabs)"
                  options={
                    isDesktop
                      ? {
                          contentStyle: {
                            width: "100%",
                            backgroundColor: colors.bg,
                          },
                        }
                      : undefined
                  }
                />
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
                <Stack.Screen name="idea/[id]" />
                <Stack.Screen
                  name="idea/[id]/edit"
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
                <Stack.Screen name="welcome" />
                <Stack.Screen name="design-system" />
              </Stack>
              <DevDock />
              <ConnectionBanner />
            </View>
            </View>
          </AuthGate>
        </LanguageGate>
        </ThemeProvider>
      </ConvexAuthProvider>
    </GlobalErrorBoundary>
  );
}

// On web, frame the phone-portrait UI in a centered max-width
// column so the app stays usable on desktop viewports without a
// per-screen responsive rewrite. On native, the inner view fills.
//
// At the desktop breakpoint we widen the frame to accommodate the
// sidebar layout introduced by `(tabs)/_layout.tsx`. The phone
// column stays at 480px so other web routes (auth, capture modal)
// keep their existing proportions on small viewports.
const frameStyles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.bg,
    ...(Platform.OS === "web"
      ? { alignItems: "center" as const }
      : null),
  },
  inner: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.bg,
    ...(Platform.OS === "web"
      ? {
          maxWidth: 480,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
        }
      : null),
  },
  innerDesktop: {
    // Sidebar (232) + content (~600). Anything wider just adds dead
    // space inside the frame; users prefer the gray gutters to live
    // outside the app shell, not between the sidebar and content.
    maxWidth: 832,
  },
});

// `Sentry.wrap()` installs the touch-event boundary (touch
// breadcrumbs) and the React profiler. The latter is a no-op while
// `tracesSampleRate: 0`, but the former is exactly what we want for
// "leave breadcrumbs": every tap is recorded against the next error.
export default wrap(RootLayout);
