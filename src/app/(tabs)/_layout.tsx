import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CaptureFab } from "@/components";
import { colors } from "@/theme/tokens";

// SF Symbol name pairs for each tab — focused (filled) and
// unfocused (outline). Calendar doesn't have a fill variant in SF
// Symbols so the same name is used for both states; tint color
// alone signals selection there.
type IconPair = { focused: SymbolViewProps["name"]; unfocused: SymbolViewProps["name"] };
const ICONS: Record<"index" | "calendar" | "backlog", IconPair> = {
  index: { focused: "person.2.fill", unfocused: "person.2" },
  calendar: { focused: "calendar", unfocused: "calendar" },
  backlog: { focused: "gift.fill", unfocused: "gift" },
};

function tabIcon(key: keyof typeof ICONS) {
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return (
      <SymbolView
        name={focused ? ICONS[key].focused : ICONS[key].unfocused}
        tintColor={color}
        size={24}
        resizeMode="scaleAspectFit"
      />
    );
  }
  TabIcon.displayName = `TabIcon_${key}`;
  return TabIcon;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1 }}>
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
        <Tabs.Screen
          name="index"
          options={{ title: t("tabs.people"), tabBarIcon: tabIcon("index") }}
        />
        <Tabs.Screen
          name="calendar"
          options={{ title: t("tabs.calendar"), tabBarIcon: tabIcon("calendar") }}
        />
        <Tabs.Screen
          name="backlog"
          options={{ title: t("tabs.gifts"), tabBarIcon: tabIcon("backlog") }}
        />
      </Tabs>
      <CaptureFab />
    </View>
  );
}
