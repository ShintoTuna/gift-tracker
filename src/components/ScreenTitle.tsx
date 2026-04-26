import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/theme/tokens";

type Props = {
  children: React.ReactNode;
  sub?: React.ReactNode;
};

// 32px serif h1 + optional 13px subtitle. Lives at top of every
// content screen.
export function ScreenTitle({ children, sub }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{children}</Text>
      {sub != null && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.text,
    letterSpacing: -0.4,
    // RN approximates web's lineHeight: 1.05 as fontSize * 1.05.
    lineHeight: 32 * 1.05,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    marginTop: 6,
  },
});
