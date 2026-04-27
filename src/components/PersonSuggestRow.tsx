import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";

import { Avatar } from "./Avatar";

type Props = {
  initial: string;
  name: string;
  relationship?: string;
  onPress?: () => void;
};

// Suggestion row for the People picker — avatar (40) + serif name +
// body relationship. Larger touch target than a chip; used in the
// list under the picker's search input.
export function PersonSuggestRow({
  initial,
  name,
  relationship,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Avatar initial={initial} size={40} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {relationship != null && (
          <Text style={styles.relationship} numberOfLines={1}>
            {relationship}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radii.md,
  },
  rowPressed: {
    backgroundColor: colors.surface2,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.text,
    lineHeight: 18 * 1.15,
  },
  relationship: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    marginTop: 2,
  },
});
