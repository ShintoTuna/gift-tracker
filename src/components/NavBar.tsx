import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";

import { Label } from "./Label";

export type NavBarLeading = "back" | "close" | "none";

type Props = {
  title: string;
  leading?: NavBarLeading;
  trailing?: React.ReactNode;
  onLeadingPress?: () => void;
};

// 54px status-bar spacer + 40px button row with mono-label title and
// optional trailing slot.
//
// Note: the design uses inline SVG for the back/close glyphs. To keep
// this step dependency-free we render the chevron / cross as plain
// Text characters; the migration to react-native-svg can happen when
// the rest of the icons (search, signal, battery, etc.) land.
export function NavBar({
  title,
  leading = "back",
  trailing,
  onLeadingPress,
}: Props) {
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
          >
            <Text style={styles.leadingGlyph}>
              {leading === "back" ? "‹" : "×"}
            </Text>
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
  leadingGlyph: {
    fontFamily: fonts.body,
    fontSize: 22,
    color: colors.text2,
    lineHeight: 22,
    marginTop: -2,
  },
});
