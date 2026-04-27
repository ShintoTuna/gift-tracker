import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from "react-native";

import { colors, fonts, radii } from "@/theme/tokens";

export type BtnTone = "primary" | "default";

type Props = {
  tone?: BtnTone;
  full?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: PressableProps["onPress"];
};

// Brass primary or surface default. Primary = "the next thing to do"
// — keep at most one or two per screen. `disabled` dims the button
// and blocks press; useful for forms gated on validation.
export function Btn({
  tone = "default",
  full,
  disabled,
  children,
  style,
  onPress,
}: Props) {
  const isPrimary = tone === "primary";
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.surface,
        full ? styles.full : styles.auto,
        !disabled &&
          pressed &&
          (isPrimary ? styles.primaryPressed : styles.surfacePressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, isPrimary ? styles.primaryText : styles.surfaceText]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  full: { alignSelf: "stretch" },
  auto: { alignSelf: "flex-start" },
  primary: { backgroundColor: colors.brass },
  primaryPressed: { backgroundColor: colors.brassDim },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  surfacePressed: { backgroundColor: colors.surface2 },
  disabled: { opacity: 0.4 },
  text: { fontSize: 15 },
  primaryText: { fontFamily: fonts.bodySemiBold, color: colors.bg },
  surfaceText: { fontFamily: fonts.bodyMedium, color: colors.text2 },
});
