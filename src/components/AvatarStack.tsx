import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radii } from "@/theme/tokens";

import { Avatar } from "./Avatar";

type Props = {
  initials: string[];
};

// Up to 3 overlapping 22px avatars; everything beyond becomes a
// "+N" overflow chip.
export function AvatarStack({ initials }: Props) {
  const visible = initials.slice(0, 3);
  const remaining = initials.length - visible.length;
  return (
    <View style={styles.row}>
      {visible.map((initial, idx) => (
        <View
          key={`${initial}-${idx}`}
          style={idx === 0 ? undefined : styles.overlap}
        >
          <Avatar initial={initial} size={22} />
        </View>
      ))}
      {remaining > 0 && (
        <View style={[styles.overflow, styles.overlap]}>
          <Text style={styles.overflowText}>+{remaining}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  overlap: {
    marginLeft: -8,
  },
  overflow: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  overflowText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.text2,
  },
});
