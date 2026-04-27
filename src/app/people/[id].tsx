import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  Btn,
  Card,
  IdeaCard,
  Label,
  NavBar,
  Pill,
} from "@/components";
import {
  formatOccasionLine,
  formatPrice,
  formatRelativeDays,
} from "@/lib/format";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ProfileData = NonNullable<
  ReturnType<typeof useQuery<typeof api.people.getProfile>>
>;
type PersonDoc = ProfileData["person"];

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useQuery(api.people.getProfile, {
    personId: id as Id<"people">,
  });

  if (profile === undefined) {
    return (
      <View style={styles.root}>
        <NavBar
          title="Profile"
          leading="back"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (profile === null) {
    return (
      <View style={styles.root}>
        <NavBar
          title="Profile"
          leading="back"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>Person not found.</Text>
      </View>
    );
  }

  const { person, occasions, ideas } = profile;
  const openIdeas = ideas.filter((i) => i.status !== "given");
  const givenIdeas = ideas.filter((i) => i.status === "given");

  return (
    <View style={styles.root}>
      <NavBar
        title="Profile"
        leading="back"
        onLeadingPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Avatar
            initial={person.name[0]?.toUpperCase() ?? "?"}
            size={56}
            accent="brass"
          />
          <View style={styles.heroText}>
            <Text style={styles.heroName} numberOfLines={1}>
              {person.nickname ?? person.name}
            </Text>
            {person.relationship != null && (
              <Text style={styles.heroRelation} numberOfLines={1}>
                {person.relationship}
              </Text>
            )}
          </View>
        </View>

        {/* Occasions — top row gets brass emphasis as "next" */}
        {occasions.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>Occasions</Label>
            <Card padding={0}>
              {occasions.map((occ, idx) => {
                const isNext = idx === 0 && occ.nextDate !== null;
                return (
                  <View
                    key={occ._id}
                    style={[
                      styles.occasionRow,
                      idx < occasions.length - 1 && styles.occasionRowDivider,
                      isNext && styles.occasionRowNext,
                    ]}
                  >
                    <View style={styles.occasionLeft}>
                      <Text style={styles.occasionTitle} numberOfLines={1}>
                        {occ.title}
                      </Text>
                      {isNext && occ.nextDate !== null && (
                        <Text style={styles.occasionNextHint}>
                          {formatRelativeDays(occ.nextDate)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.occasionMeta}>
                      {formatOccasionLine({
                        recurrence: occ.recurrence,
                        date: occ.date,
                      })}
                    </Text>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {/* Interests */}
        {person.interests.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>Interests</Label>
            <View style={styles.pillRow}>
              {person.interests.map((interest) => (
                <Pill key={interest}>{interest}</Pill>
              ))}
            </View>
          </View>
        )}

        {/* Open ideas */}
        {openIdeas.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>
              Open ideas · {openIdeas.length}
            </Label>
            <View style={styles.cardStack}>
              {openIdeas.map((idea) => (
                <IdeaCard
                  key={idea._id}
                  title={idea.title}
                  source={shortenSource(idea.sourceUrl)}
                  price={formatPrice(idea.priceEstimate, idea.currency)}
                  peopleInitials={
                    idea.taggedPeople.length > 1
                      ? buildInitials(idea.taggedPeople, person)
                      : undefined
                  }
                  status="open"
                />
              ))}
            </View>
          </View>
        )}

        {/* Given history */}
        {givenIdeas.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>
              Given · {givenIdeas.length}
            </Label>
            <View style={styles.cardStack}>
              {givenIdeas.map((idea) => (
                <IdeaCard
                  key={idea._id}
                  title={idea.title}
                  source={shortenSource(idea.sourceUrl)}
                  price={formatPrice(idea.priceEstimate, idea.currency)}
                  status="given"
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty-state hint when there's nothing yet */}
        {openIdeas.length === 0 && givenIdeas.length === 0 && (
          <View style={styles.section}>
            <Card>
              <Text style={styles.cardMeta}>
                No gift ideas yet. Brainstorm some below or add one from
                Quick Capture.
              </Text>
            </Card>
          </View>
        )}

        {/* Brainstorm CTA */}
        <View style={[styles.section, styles.ctaWrap]}>
          <Btn
            tone="primary"
            full
            onPress={() =>
              router.push({
                pathname: "/brainstorm/[personId]",
                params: { personId: person._id },
              })
            }
          >
            Brainstorm a gift
          </Btn>
        </View>
      </ScrollView>
    </View>
  );
}

// "stihl.com" from "https://www.stihl.com/gta-26".
function shortenSource(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// AvatarStack initials excluding the current profile person — show
// "this idea is also for ..." rather than redundant self-reference.
// Falls back to the raw ID-letter when name lookup isn't available
// (the profile query only returns ids for taggedPeople, not the
// people themselves).
function buildInitials(
  taggedPeople: readonly string[],
  currentPerson: PersonDoc,
): string[] {
  // Without a denormalized lookup we can't render other people's
  // initials accurately, so collapse to a placeholder count for now.
  const others = taggedPeople.filter((id) => id !== currentPerson._id);
  return others.map(() => "•");
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text2,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 32 * 1.05,
  },
  heroRelation: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  ctaWrap: {
    marginTop: spacing.xs,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  cardHeadline: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text2,
    marginTop: 4,
    lineHeight: 18,
  },
  occasionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  occasionRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // Subtle brass tint + 2px brass left edge marks the upcoming
  // occasion. Tint is intentionally low-saturation — the brass
  // "in N days" text below the title carries most of the emphasis.
  occasionRowNext: {
    backgroundColor: "rgba(200, 164, 90, 0.06)",
    borderLeftWidth: 2,
    borderLeftColor: colors.brass,
  },
  occasionLeft: {
    flex: 1,
    minWidth: 0,
  },
  occasionTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.text,
  },
  occasionNextHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.brass,
    marginTop: 2,
  },
  occasionMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text2,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cardStack: {
    gap: spacing.md,
  },
});
