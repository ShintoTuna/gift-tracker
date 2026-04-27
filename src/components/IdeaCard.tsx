import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/theme/tokens";

import { AvatarStack } from "./AvatarStack";
import { Card } from "./Card";
import { Pill } from "./Pill";

export type IdeaStatus = "idea" | "given";

type Props = {
  title: string;
  source?: string;
  // Pre-formatted price string (use src/lib/format.ts → formatPrice).
  price?: string;
  // Initials of all tagged people. Stack omitted if undefined or empty.
  peopleInitials?: string[];
  occasion?: string;
  // Two states for now. "given" gets the fern Pill plus dimmed
  // strikethrough title; "idea" uses the default tone.
  status: IdeaStatus;
  onPress?: () => void;
};

const STATUS_LABEL: Record<IdeaStatus, string> = {
  idea: "Open",
  given: "Given",
};

// Composed gift-idea card. Used on the Profile screen, the Backlog
// screen (Step 6+), and the Brainstorm result list (Step 7+).
//
// The 60px thumbnail is a solid-color block for now — image upload +
// real thumbnail rendering lands with Convex File Storage in a later
// step. The diagonal-stripe pattern from the web design needs SVG
// support, also deferred.
export function IdeaCard({
  title,
  source,
  price,
  peopleInitials,
  occasion,
  status,
  onPress,
}: Props) {
  const isGiven = status === "given";
  const content = (
    <Card>
      <View style={styles.row}>
        <View style={styles.thumb} />
        <View style={styles.middle}>
          <Text
            style={[styles.title, isGiven && styles.titleGiven]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {source != null && (
            <Text style={styles.source} numberOfLines={1}>
              {source}
            </Text>
          )}
          {(peopleInitials?.length || occasion) && (
            <View style={styles.metaRow}>
              {peopleInitials && peopleInitials.length > 0 && (
                <AvatarStack initials={peopleInitials} />
              )}
              {occasion && <Text style={styles.occasion}>{occasion}</Text>}
            </View>
          )}
        </View>
        <View style={styles.right}>
          {price ? <Text style={styles.price}>{price}</Text> : null}
          <Pill tone={isGiven ? "fern" : "default"}>
            {STATUS_LABEL[status]}
          </Pill>
        </View>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#3a4a4a",
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
    lineHeight: 19,
  },
  titleGiven: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  source: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  occasion: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text2,
  },
  right: {
    alignItems: "flex-end",
    gap: spacing.sm,
    flexShrink: 0,
  },
  price: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.text,
  },
  pressed: {
    opacity: 0.7,
  },
});
