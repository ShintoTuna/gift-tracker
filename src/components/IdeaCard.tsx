import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { thumbColorForSeed } from "@/lib/seedColor";
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
  // When set, replaces the placeholder thumbnail with the uploaded
  // image. Falls back to the muted placeholder when null/undefined.
  imageUrl?: string | null;
  // Stable seed for the placeholder thumb's color. Same seed → same
  // color, so a row's tile keeps its hue across renders without us
  // having to persist anything. Idea ID is the canonical choice;
  // falls back to the title (used by the design-system preview where
  // there's no row id).
  placeholderSeed?: string;
  // Two states for now. "given" gets the fern Pill plus dimmed
  // strikethrough title; "idea" uses the default tone.
  status: IdeaStatus;
  onPress?: () => void;
};

const STATUS_KEY: Record<IdeaStatus, "ideaCard.statusOpen" | "ideaCard.statusGiven"> = {
  idea: "ideaCard.statusOpen",
  given: "ideaCard.statusGiven",
};

// Composed gift-idea card. Used on the Profile screen, the Backlog
// screen, and the Brainstorm result list (post-launch).
//
// When no `imageUrl` is supplied, the 60px thumbnail falls back to
// a deterministic placeholder: a Midnight Garden palette color
// chosen by hashing `placeholderSeed`, with a subtle diagonal sheen
// for depth (mimicking the 4% diagonal stripe in the web design
// without needing react-native-svg).
export function IdeaCard({
  title,
  source,
  price,
  peopleInitials,
  occasion,
  imageUrl,
  placeholderSeed,
  status,
  onPress,
}: Props) {
  const { t } = useTranslation();
  const isGiven = status === "given";
  const placeholderColor = thumbColorForSeed(placeholderSeed ?? title);
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
            {t(STATUS_KEY[status])}
          </Pill>
        </View>
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
