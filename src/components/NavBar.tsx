import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/theme/tokens";

import { Label } from "./Label";

export type NavBarLeading = "back" | "close" | "none";

type Props = {
  title: string;
  leading?: NavBarLeading;
  trailing?: React.ReactNode;
  onLeadingPress?: () => void;
};

// 54px status-bar spacer + 40px button row with mono-label title and
// optional trailing slot. The leading glyph is an SF Symbol so iOS
// renders it pixel-perfect-centered.
export function NavBar({
  title,
  leading = "back",
  trailing,
  onLeadingPress,
}: Props) {
  const { t } = useTranslation();
  return (
    <View>
      <View style={styles.spacer} />
      <View style={styles.row}>
        {leading !== "none" ? (
          <Pressable
            onPress={onLeadingPress}
            style={({ pressed }) => [
              styles.leadingButton,
              pressed && styles.leadingPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              leading === "back" ? t("common.back") : t("common.close")
            }
          >
            <SymbolView
              name={leading === "back" ? "chevron.left" : "xmark"}
              tintColor={colors.text2}
              weight="semibold"
              size={leading === "back" ? 16 : 14}
              resizeMode="scaleAspectFit"
            />
          </Pressable>
        ) : (
          <View style={styles.leadingPlaceholder} />
        )}
        <Label>{title}</Label>
        {trailing ?? <View style={styles.leadingPlaceholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: 54,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  leadingButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  leadingPressed: {
    backgroundColor: colors.surface2,
  },
  leadingPlaceholder: {
    width: 40,
    height: 40,
  },
});
