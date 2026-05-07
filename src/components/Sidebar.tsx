import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radii, spacing, tints } from "@/theme/tokens";

import { Icon, type IconName } from "./Icon";

export const SIDEBAR_WIDTH = 232;

type NavKey = "people" | "calendar" | "gifts" | "wishlist";

type NavItem = {
  key: NavKey;
  href: "/" | "/calendar" | "/backlog" | "/wishlist";
  labelKey:
    | "tabs.people"
    | "tabs.calendar"
    | "tabs.gifts"
    | "tabs.wishlist";
  icon: { focused: IconName; unfocused: IconName };
};

const NAV: readonly NavItem[] = [
  {
    key: "people",
    href: "/",
    labelKey: "tabs.people",
    icon: { focused: "person.2.fill", unfocused: "person.2" },
  },
  {
    key: "calendar",
    href: "/calendar",
    labelKey: "tabs.calendar",
    icon: { focused: "calendar", unfocused: "calendar" },
  },
  {
    key: "gifts",
    href: "/backlog",
    labelKey: "tabs.gifts",
    icon: { focused: "gift.fill", unfocused: "gift" },
  },
  {
    key: "wishlist",
    href: "/wishlist",
    labelKey: "tabs.wishlist",
    icon: { focused: "star.fill", unfocused: "star" },
  },
];

function activeKey(pathname: string): NavKey {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/backlog")) return "gifts";
  if (pathname.startsWith("/wishlist")) return "wishlist";
  return "people";
}

// Desktop-only left rail. Replaces the bottom tab bar at wide
// breakpoints. Brand at the top, primary "Quick capture" CTA, the
// three top-level destinations, and a settings link at the bottom.
//
// Active state is derived from `usePathname()` rather than tab state
// so the rail stays in sync when sub-screens push onto a tab — e.g.
// while viewing /people/[id] the People row stays highlighted.
export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const active = activeKey(pathname);
  const onWishlist = active === "wishlist";

  // On the Wish List rail the CTA pre-flips the "Also for me" toggle
  // in the capture form. The form itself is identical; only the
  // toggle's initial value changes.
  const onCapture = () => {
    if (onWishlist) {
      router.push({ pathname: "/capture", params: { forSelf: "1" } });
    } else {
      router.push("/capture");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Giftsmith</Text>
      </View>

      <Pressable
        onPress={onCapture}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        accessibilityRole="button"
        accessibilityLabel={t("capture.fabLabel")}
      >
        <Icon name="plus" color={colors.bg} weight="semibold" size={18} />
        <Text style={styles.ctaText}>{t("capture.title")}</Text>
      </Pressable>

      <View style={styles.nav}>
        {NAV.map((item) => {
          const isActive = item.key === active;
          return (
            <Pressable
              key={item.key}
              onPress={() => router.navigate(item.href)}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.navItem,
                hovered && !isActive && styles.navItemHover,
                isActive && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
              accessibilityRole="link"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t(item.labelKey)}
            >
              <Icon
                name={isActive ? item.icon.focused : item.icon.unfocused}
                color={isActive ? colors.brass : colors.text2}
                size={20}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.spacer} />

      <Pressable
        onPress={() => router.push("/settings")}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.navItem,
          hovered && styles.navItemHover,
          pressed && styles.navItemPressed,
        ]}
        accessibilityRole="link"
        accessibilityLabel={t("settings.title")}
      >
        <Icon name="gearshape" color={colors.text2} size={20} />
        <Text style={styles.navLabel}>{t("settings.title")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    height: "100%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.bg,
  },
  brandRow: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.text,
    letterSpacing: -0.3,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brass,
    borderRadius: radii.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  ctaPressed: {
    backgroundColor: colors.brassDim,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.bg,
  },
  nav: {
    gap: 2,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  navItemHover: {
    backgroundColor: colors.surface,
  },
  navItemActive: {
    backgroundColor: tints.brassFill,
  },
  navItemPressed: {
    backgroundColor: colors.surface2,
  },
  navLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text2,
  },
  navLabelActive: {
    color: colors.brass,
  },
  spacer: {
    flex: 1,
  },
});
