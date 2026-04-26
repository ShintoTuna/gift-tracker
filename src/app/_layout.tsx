import { ConvexProvider } from "convex/react";
import { Stack } from "expo-router";

import { convex } from "@/lib/convex";

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="people/[id]" />
        <Stack.Screen
          name="capture"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="brainstorm/[personId]"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </ConvexProvider>
  );
}
