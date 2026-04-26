import { Tabs } from "expo-router";

import { colors } from "@/theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.brass,
        tabBarInactiveTintColor: colors.text3,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "People" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="backlog" options={{ title: "Backlog" }} />
    </Tabs>
  );
}
