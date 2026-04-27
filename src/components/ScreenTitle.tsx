import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/theme/tokens";

type Props = {
  children: React.ReactNode;
  sub?: React.ReactNode;
  // Optional flanking slots — typically a small icon button on the
  // left and a Pill action on the right. Both are absolutely
  // positioned so the title stays truly centered regardless of how
  // wide the slots get.
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

// 32px serif h1 + optional 13px subtitle, centered. Optional
// leading / trailing slots flank the title for tabs that need to
// surface chrome (gear, "+ Person") inline with the header.
export function ScreenTitle({ children, sub, leading, trailing }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        {leading != null && <View style={styles.leading}>{leading}</View>}
        <Text style={styles.title}>{children}</Text>
        {trailing != null && <View style={styles.trailing}>{trailing}</View>}
      </View>
      {sub != null && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    minHeight: 44,
  },
  leading: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  trailing: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.text,
    letterSpacing: -0.4,
    // RN approximates web's lineHeight: 1.05 as fontSize * 1.05.
    lineHeight: 32 * 1.05,
    textAlign: "center",
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    marginTop: 6,
    textAlign: "center",
  },
});
