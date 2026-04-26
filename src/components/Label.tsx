import { StyleSheet, Text, type TextStyle } from "react-native";

import { colors, fonts } from "@/theme/tokens";

export type LabelTone = "default" | "brass" | "claret" | "fern";

type Props = {
  tone?: LabelTone;
  children: React.ReactNode;
  style?: TextStyle;
};

const toneColor: Record<LabelTone, string> = {
  default: colors.text3,
  brass: colors.brass,
  claret: colors.claret,
  fern: colors.fern,
};

// 11px Plex Mono, uppercase, wide tracking. Used for eyebrows,
// structural counters, filter labels, urgency markers.
export function Label({ tone = "default", children, style }: Props) {
  return (
    <Text style={[styles.base, { color: toneColor[tone] }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.mono,
    fontSize: 11,
    // Web uses 0.16em letter-spacing on 11px text; in RN that's points.
    letterSpacing: 11 * 0.16,
    textTransform: "uppercase",
  },
});
