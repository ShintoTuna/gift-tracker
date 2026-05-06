import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/theme/tokens";

import { Icon } from "./Icon";

// Floating brass primary "+" button anchored bottom-right of the tab
// screens. Opens the Quick Capture modal — the headline product
// flow ("sub-10s capture"). Lives in `(tabs)/_layout.tsx` so it
// shows over all three tabs and disappears when a modal or detail
// screen takes over.
//
// Glyph is an SF Symbol so iOS renders it pixel-perfect-centered
// (manual Text-glyph centering with line-height tweaks looks subtly
// off — "+" character has uneven optical metrics).
export function CaptureFab() {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => router.push("/capture")}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t("capture.fabLabel")}
    >
      <Icon name="plus" color={colors.bg} weight="semibold" size={26} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 96,
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brass,
    alignItems: "center",
    justifyContent: "center",
    // iOS-style soft elevation. Drop shadow on dark bg looks subtle
    // but reads as "this floats above everything else."
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPressed: {
    backgroundColor: colors.brassDim,
  },
});
