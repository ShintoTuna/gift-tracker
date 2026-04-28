import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from "@expo-google-fonts/ibm-plex-mono";
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from "@expo-google-fonts/work-sans";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConvexProvider, useQuery } from "convex/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { DevDock } from "@/components";
// IMPORTANT: importing `@/i18n` runs i18next's `init()` for its
// side effect. This must happen before any child component calls
// `useTranslation()`, which the static import order guarantees.
import {
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
} from "@/i18n";
import { convex } from "@/lib/convex";

import { api } from "../../convex/_generated/api";

// Hold the splash up until fonts are ready. Without this, the app
// boots in fallback fonts for a frame and then re-flows.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignored: setting splash behavior is best-effort and may have been
  // called already by another part of the lifecycle.
});

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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
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
    <ConvexProvider client={convex}>
      <LanguageGate>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
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
      </LanguageGate>
    </ConvexProvider>
  );
}
