import { useMutation } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";

import { api } from "../../convex/_generated/api";

// Floating dev menu, rendered once at the root layout. Hidden in
// production via __DEV__. Tap the dim "dev" pill to expand into a
// vertical menu of common dev actions; long-press to hide it for the
// rest of this session (a refresh restores it).
//
// Add new dev links by appending to MENU_ITEMS or by handling a
// custom action inline (like Seed dev data).
export function DevDock() {
  if (!__DEV__) return null;
  return <DevDockInner />;
}

function DevDockInner() {
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const seedDevData = useMutation(api.seed.seedDevData);

  if (hidden) return null;

  const flash = (message: string, ms = 2200) => {
    setStatus(message);
    setTimeout(() => setStatus((current) => (current === message ? null : current)), ms);
  };

  const onSeed = async () => {
    flash("seeding...", 60_000);
    try {
      const r = await seedDevData();
      flash(`seeded ${r.peopleCount}p / ${r.occasionsCount}o / ${r.giftIdeasCount}i`);
    } catch (err) {
      flash(`error: ${err instanceof Error ? err.message : String(err)}`, 4000);
    }
    setExpanded(false);
  };

  const onOpenDesignSystem = () => {
    router.push("/design-system");
    setExpanded(false);
  };

  // Recovery: dismiss any open modals, then reset to the People tab.
  // Useful when a stub screen has no back affordance yet.
  const onGoHome = () => {
    try {
      router.dismissAll();
    } catch {
      // No modals to dismiss — fine, continue to replace.
    }
    router.replace("/");
    setExpanded(false);
  };

  return (
    <View style={styles.dock} pointerEvents="box-none">
      {expanded && (
        <View style={styles.menu}>
          <MenuItem label="Home" onPress={onGoHome} />
          <View style={styles.divider} />
          <MenuItem label="Design system" onPress={onOpenDesignSystem} />
          <View style={styles.divider} />
          <MenuItem label="Seed dev data" onPress={onSeed} />
          {status != null && (
            <>
              <View style={styles.divider} />
              <Text style={styles.status}>{status}</Text>
            </>
          )}
        </View>
      )}
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        onLongPress={() => {
          setExpanded(false);
          setHidden(true);
        }}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.trigger,
          expanded && styles.triggerExpanded,
          pressed && styles.triggerPressed,
        ]}
      >
        <Text style={styles.triggerText}>dev</Text>
      </Pressable>
    </View>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <Text style={styles.itemText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    bottom: 96,
    // Anchored bottom-left so it doesn't collide with the brass
    // CaptureFab at bottom-right. CaptureFab is the production
    // primary action; DevDock is a dim dev affordance.
    left: 14,
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  trigger: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.25,
  },
  triggerExpanded: {
    opacity: 0.95,
  },
  triggerPressed: {
    opacity: 1,
  },
  triggerText: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    color: colors.text2,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  menu: {
    minWidth: 168,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  item: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  itemPressed: {
    backgroundColor: colors.surface2,
  },
  itemText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  status: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.text3,
  },
});
