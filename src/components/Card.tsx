import { StyleSheet, View, type ViewStyle } from "react-native";

import { colors, radii, spacing } from "@/theme/tokens";

export type CardTone = "default" | "nested";

type Props = {
  tone?: CardTone;
  padding?: number;
  children: React.ReactNode;
  style?: ViewStyle;
};

// 14px radius, 14px default padding (spacing.base). `nested` tone
// uses the lighter surface — for cards-within-cards.
export function Card({
  tone = "default",
  padding = spacing.base,
  children,
  style,
}: Props) {
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: tone === "nested" ? colors.surface2 : colors.surface,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
  },
});
