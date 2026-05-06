import { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

// NavBar = 54px top spacer + 40px button row + spacing.lg (16) margin.
// KeyboardAvoidingView measures from the screen top, so on iOS we
// offset by the navbar height to keep the bottom of the scroll area
// just above the keyboard instead of partially behind it.
const NAVBAR_HEIGHT = 54 + 40 + 16;

type Props = {
  children: ReactNode;
};

// Shared wrapper for screens with a NavBar + ScrollView form body.
// iOS uses "padding" (the keyboard pushes content up); Android uses
// "height" so the wrapped area resizes — combined with the system's
// default adjustResize this keeps the Save button on screen.
export function KeyboardForm({ children }: Props) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? NAVBAR_HEIGHT : 0}
      style={styles.flex}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
