import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";

import { CaptureFab, Icon, Sidebar, type IconName } from "@/components";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { colors } from "@/theme/tokens";

// SF Symbol name pairs for each tab — focused (filled) and
// unfocused (outline). Calendar doesn't have a fill variant in SF
// Symbols so the same name is used for both states; tint color
// alone signals selection there.
type IconPair = { focused: IconName; unfocused: IconName };
const ICONS: Record<
  "index" | "calendar" | "backlog" | "wishlist",
  IconPair
> = {
  index: { focused: "person.2.fill", unfocused: "person.2" },
  calendar: { focused: "calendar", unfocused: "calendar" },
  backlog: { focused: "gift.fill", unfocused: "gift" },
  wishlist: { focused: "star.fill", unfocused: "star" },
};

function tabIcon(key: keyof typeof ICONS) {
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return (
      <Icon
        name={focused ? ICONS[key].focused : ICONS[key].unfocused}
        color={color}
        size={24}
      />
    );
  }
  TabIcon.displayName = `TabIcon_${key}`;
  return TabIcon;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const isDesktop = useBreakpoint() === "desktop";

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? "row" : "column" }}>
      {isDesktop ? <Sidebar /> : null}
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: isDesktop
              ? { display: "none" }
              : {
                  backgroundColor: colors.bg,
                  borderTopColor: colors.border,
                  // On web, @react-navigation/bottom-tabs leaves no
                  // room for the label under the icon, clipping
                  // descenders. Give the bar an explicit height
                  // with breathing room.
                  ...(Platform.OS === "web"
                    ? { height: 64, paddingTop: 6, paddingBottom: 8 }
                    : null),
                },
            tabBarLabelStyle:
              Platform.OS === "web" ? { paddingBottom: 4 } : undefined,
            tabBarActiveTintColor: colors.brass,
            tabBarInactiveTintColor: colors.text3,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t("tabs.people"),
              tabBarIcon: tabIcon("index"),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: t("tabs.calendar"),
              tabBarIcon: tabIcon("calendar"),
            }}
          />
          <Tabs.Screen
            name="backlog"
            options={{
              title: t("tabs.gifts"),
              tabBarIcon: tabIcon("backlog"),
            }}
          />
          <Tabs.Screen
            name="wishlist"
            options={{
              title: t("tabs.wishlist"),
              tabBarIcon: tabIcon("wishlist"),
            }}
          />
        </Tabs>
        {isDesktop ? null : <CaptureFab />}
      </View>
    </View>
  );
}
