import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";

import { colors, fonts } from "@/theme/tokens";

export type AvatarSize = 22 | 40 | 56;
export type AvatarAccent = "default" | "brass" | "claret";

type Props = {
  initial: string;
  size?: AvatarSize;
  accent?: AvatarAccent;
};

const accentBorder: Record<AvatarAccent, string> = {
  default: colors.border,
  brass: colors.brass,
  claret: colors.claret,
};

const accentForeground: Record<AvatarAccent, string> = {
  default: colors.text2,
  brass: colors.brass,
  claret: colors.claret,
};

// Diagonal-gradient avatar with single-letter initial. Three sizes
// mapped to the design's three usages: 22 (avatar stacks on idea
// cards), 40 (list rows), 56 (Profile screen header hero).
export function Avatar({ initial, size = 40, accent = "default" }: Props) {
  const fontSize = size === 22 ? 11 : size === 40 ? 16 : 22;
  const borderWidth = accent === "default" ? 1 : 1.5;
  return (
    <LinearGradient
      // 140deg in CSS → roughly upper-left to lower-right diagonal.
      colors={["#2a3d33", "#16241e"]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          borderColor: accentBorder[accent],
        },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize,
          color: accentForeground[accent],
        }}
      >
        {initial}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
