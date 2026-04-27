import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from "react-native";

import { colors, fonts, radii, tints } from "@/theme/tokens";

export type BtnTone = "primary" | "default" | "danger";

type Props = {
  tone?: BtnTone;
  full?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: PressableProps["onPress"];
};

// Three tones:
// - primary: brass background, "the next thing to do" — one or two per screen max
// - default: surface background with border — secondary actions
// - danger:  claret-tinted background — destructive actions (delete, etc.)
//
// `disabled` dims the button and blocks press; useful for forms
// gated on validation.
export function Btn({
  tone = "default",
  full,
  disabled,
  children,
  style,
  onPress,
}: Props) {
  const toneStyle =
    tone === "primary"
      ? styles.primary
      : tone === "danger"
        ? styles.danger
        : styles.surface;
  const tonePressedStyle =
    tone === "primary"
      ? styles.primaryPressed
      : tone === "danger"
        ? styles.dangerPressed
        : styles.surfacePressed;
  const toneTextStyle =
    tone === "primary"
      ? styles.primaryText
      : tone === "danger"
        ? styles.dangerText
        : styles.surfaceText;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        toneStyle,
        full ? styles.full : styles.auto,
        !disabled && pressed && tonePressedStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, toneTextStyle]}>{children}</Text>
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
  danger: {
    backgroundColor: tints.claretFill,
    borderWidth: 1,
    borderColor: tints.claretEdge,
  },
  dangerPressed: { backgroundColor: "rgba(160, 69, 69, 0.22)" },
  disabled: { opacity: 0.4 },
  text: { fontSize: 15 },
  primaryText: { fontFamily: fonts.bodySemiBold, color: colors.bg },
  surfaceText: { fontFamily: fonts.bodyMedium, color: colors.text2 },
  dangerText: { fontFamily: fonts.bodyMedium, color: colors.claret },
});
