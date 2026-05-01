import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { thumbColorForSeed } from "@/lib/seedColor";
import { colors, fonts, spacing } from "@/theme/tokens";

import { AvatarStack } from "./AvatarStack";
import { Card } from "./Card";

type Props = {
  title: string;
  // Description preview (2-line ellipsis). Falls back gracefully when
  // omitted or empty.
  description?: string;
  // Initials of all tagged people. Stack omitted if undefined or empty.
  peopleInitials?: string[];
  // Replaces the placeholder thumbnail with the uploaded image.
  // Falls back to the muted placeholder when null/undefined.
  imageUrl?: string | null;
  // Stable seed for the placeholder thumb's color. Same seed → same
  // color, so a row's tile keeps its hue across renders without us
  // having to persist anything. Idea ID is the canonical choice;
  // falls back to the title (used by the design-system preview where
  // there's no row id).
  placeholderSeed?: string;
  // Optional caption rendered below the description (e.g.
  // `Given · 24 Dec 2024 · Christmas` on the profile-given list).
  caption?: string;
  onPress?: () => void;
};

// Composed gift-idea card. Used on the Profile screen, the Backlog
// screen, and the Brainstorm result list (post-launch).
//
// Layout: 60px thumbnail · title + description preview · avatar stack.
// Status, source URL, price, and occasion live on the detail screen
// rather than the card; keeping the card visual to title + image +
// who-it's-for makes scanning the list practical.
export function IdeaCard({
  title,
  description,
  peopleInitials,
  imageUrl,
  placeholderSeed,
  caption,
  onPress,
}: Props) {
  const placeholderColor = thumbColorForSeed(placeholderSeed ?? title);
  const trimmedDescription = description?.trim();
  const content = (
    <Card>
      <View style={styles.row}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumb}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <View style={[styles.thumb, { backgroundColor: placeholderColor }]}>
            <LinearGradient
              colors={["rgba(255,255,255,0.07)", "rgba(0,0,0,0.18)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
        <View style={styles.middle}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {trimmedDescription ? (
            <Text style={styles.description} numberOfLines={2}>
              {trimmedDescription}
            </Text>
          ) : null}
          {caption ? (
            <Text style={styles.caption} numberOfLines={1}>
              {caption}
            </Text>
          ) : null}
        </View>
        {peopleInitials && peopleInitials.length > 0 ? (
          <View style={styles.right}>
            <AvatarStack initials={peopleInitials} />
          </View>
        ) : null}
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
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
    alignItems: "center",
    gap: spacing.md,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
    overflow: "hidden",
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
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text2,
    marginTop: 3,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text3,
    marginTop: 4,
  },
  right: {
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});
