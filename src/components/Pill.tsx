import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { colors, fonts, radii, tints } from "@/theme/tokens";

export type PillTone = "default" | "brass" | "claret" | "fern";

type Props = {
  tone?: PillTone;
  dashed?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
};

type ToneTokens = { bg: string; border: string; fg: string };

const toneTokens: Record<PillTone, ToneTokens> = {
  default: { bg: colors.surface, border: colors.border, fg: colors.text2 },
  brass: { bg: tints.brassFill, border: tints.brassEdge, fg: colors.brass },
  claret: { bg: tints.claretFill, border: tints.claretEdge, fg: colors.claret },
  fern: { bg: tints.fernFill, border: tints.fernEdge, fg: colors.fern },
};

// Filter chip / status indicator. 10px mono, uppercase. Dashed
// border variant signals "+ Add" affordances.
export function Pill({ tone = "default", dashed, children, style }: Props) {
  const t = toneTokens[tone];
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: t.bg,
          borderColor: t.border,
          borderStyle: dashed ? "dashed" : "solid",
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 10 * 0.14,
    textTransform: "uppercase",
  },
});
