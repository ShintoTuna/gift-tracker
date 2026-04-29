import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/theme/tokens";

import { Avatar } from "./Avatar";
import { Label } from "./Label";

type Props = {
  initial: string;
  // Optional avatar photo URL. Falls back to the initial-on-gradient
  // when null/undefined (Avatar handles the branch internally).
  imageUrl?: string | null;
  name: string;
  relation?: string;
  // e.g., "Birthday · in 5 days" — preformatted by the caller.
  dateLine?: string;
  ideas?: number;
  // claret avatar + claret date line for "this week" rows.
  urgent?: boolean;
  // Last row in a section drops the divider.
  hideBorder?: boolean;
  onPress?: () => void;
};

// Composed list row used on the People list (and reused on the
// Calendar screen). Avatar (40px) + name (serif 18) + optional
// relation (body 13 text3) + date line (body 13 text2/claret) +
// trailing idea count (serif 18 brass-or-text3) with a "ideas"/"idea"
// Label below it.
export function PersonRow({
  initial,
  imageUrl,
  name,
  relation,
  dateLine,
  ideas,
  urgent,
  hideBorder,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !hideBorder && styles.rowBorder,
        pressed && styles.rowPressed,
      ]}
    >
      <Avatar
        initial={initial}
        imageUrl={imageUrl}
        size={40}
        accent={urgent ? "claret" : "default"}
      />
      <View style={styles.middle}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {relation != null && (
            <Text style={styles.relation} numberOfLines={1}>
              {relation}
            </Text>
          )}
        </View>
        {dateLine != null && (
          <Text
            style={[styles.dateLine, urgent && styles.dateLineUrgent]}
            numberOfLines={1}
          >
            {dateLine}
          </Text>
        )}
      </View>
      {ideas != null && (
        <View style={styles.right}>
          <Text
            style={[
              styles.ideaCount,
              ideas > 0 ? styles.ideaCountActive : styles.ideaCountEmpty,
            ]}
          >
            {ideas}
          </Text>
          <Label>{ideas === 1 ? "idea" : "ideas"}</Label>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    paddingVertical: spacing.base,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.text,
    flexShrink: 1,
  },
  relation: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    flexShrink: 0,
  },
  dateLine: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text2,
    marginTop: 2,
  },
  dateLineUrgent: {
    color: colors.claret,
  },
  right: {
    alignItems: "flex-end",
  },
  ideaCount: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 18,
  },
  ideaCountActive: {
    color: colors.brass,
  },
  ideaCountEmpty: {
    color: colors.text3,
  },
});
