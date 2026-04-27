import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";

import { Label } from "./Label";

type Props = TextInputProps & {
  label: string;
  hint?: string;
  containerStyle?: ViewStyle;
};

// Label + TextInput pair styled in the design system. Forwards every
// TextInputProps so callers can add `multiline`, `autoFocus`,
// `keyboardType`, etc. without us re-exposing each one.
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, hint, containerStyle, style, ...textInputProps },
  ref,
) {
  return (
    <View style={containerStyle}>
      <Label style={styles.label}>{label}</Label>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.text3}
        selectionColor={colors.brass}
        style={[styles.input, style]}
        {...textInputProps}
      />
      {hint != null && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    marginTop: 4,
  },
});
