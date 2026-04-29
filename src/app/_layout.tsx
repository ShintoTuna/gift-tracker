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
import { ConvexProvider } from "convex/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";

import { DevDock } from "@/components";
import { convex } from "@/lib/convex";

// Hold the splash up until fonts are ready. Without this, the app
// boots in fallback fonts for a frame and then re-flows.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignored: setting splash behavior is best-effort and may have been
  // called already by another part of the lifecycle.
});

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
    <ConvexProvider client={convex}>
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
    </ConvexProvider>
  );
}
