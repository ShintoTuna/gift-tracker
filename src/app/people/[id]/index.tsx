import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { Trans, useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  formatBirthMonthDay,
  formatOccasionLine,
  formatPrice,
  formatRelativeDays,
  shortenSource,
} from "@/lib/format";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type ProfileData = NonNullable<
  ReturnType<typeof useQuery<typeof api.people.getProfile>>
>;
type PersonDoc = ProfileData["person"];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useQuery(api.people.getProfile, {
    personId: id as Id<"people">,
  });

  if (profile === undefined) {
    return (
      <View style={styles.root}>
        <NavBar
          title={t("profile.title")}
          leading="back"
          onLeadingPress={() => router.back()}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.brass} />
        </View>
      </View>
    );
  }

  if (profile === null) {
    return (
      <View style={styles.root}>
        <NavBar
          title={t("profile.title")}
          leading="back"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>{t("profile.notFound")}</Text>
      </View>
    );
  }

  const { person, occasions, ideas } = profile;
  const openIdeas = ideas.filter((i) => i.status !== "given");
  const givenIdeas = ideas.filter((i) => i.status === "given");

  return (
    <View style={styles.root}>
      <NavBar
        title={t("profile.title")}
        leading="back"
        onLeadingPress={() => router.back()}
        trailing={
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/people/[id]/edit",
                params: { id: profile.person._id },
              })
            }
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t("profile.editA11y")}
          >
            <Pill>{t("profile.editPill")}</Pill>
          </Pressable>
        }
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

        {/* About — birth date (month + day, no year stored) */}
        {person.dateOfBirth != null && (
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>{t("profile.about")}</Label>
            <Card>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>{t("profile.born")}</Text>
                <Text style={styles.aboutValue}>
                  {formatBirthMonthDay(person.dateOfBirth)}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Occasions — top row gets brass emphasis as "next" */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Label>{t("profile.occasions")}</Label>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/occasion/new",
                  params: { personId: person._id },
                })
              }
              hitSlop={6}
            >
              <Pill tone="brass" dashed>
                {t("profile.addOccasion")}
              </Pill>
            </Pressable>
          </View>
          {occasions.length > 0 ? (
            <Card padding={0}>
              {occasions.map((occ, idx) => {
                const isNext = idx === 0 && occ.nextDate !== null;
                return (
                  <Pressable
                    key={occ._id}
                    onPress={() =>
                      router.push({
                        pathname: "/occasion/[id]",
                        params: { id: occ._id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.occasionRow,
                      idx < occasions.length - 1 && styles.occasionRowDivider,
                      isNext && styles.occasionRowNext,
                      pressed && styles.occasionRowPressed,
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
                  </Pressable>
                );
              })}
            </Card>
          ) : (
            <Text style={styles.occasionEmpty}>
              <Trans
                i18nKey="profile.occasionsEmpty"
                components={{
                  accent: <Text style={styles.occasionEmptyAccent} />,
                }}
              />
            </Text>
          )}
        </View>

        {/* Interests */}
        {person.interests.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>{t("profile.interests")}</Label>
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
              {t("profile.openIdeas", { count: openIdeas.length })}
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
                  status={idea.status}
                />
              ))}
            </View>
          </View>
        )}

        {/* Given history */}
        {givenIdeas.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>
              {t("profile.givenIdeas", { count: givenIdeas.length })}
            </Label>
            <View style={styles.cardStack}>
              {givenIdeas.map((idea) => (
                <IdeaCard
                  key={idea._id}
                  title={idea.title}
                  source={shortenSource(idea.sourceUrl)}
                  price={formatPrice(idea.priceEstimate, idea.currency)}
                  status={idea.status}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty-state hint when there's nothing yet */}
        {openIdeas.length === 0 && givenIdeas.length === 0 && (
          <View style={styles.section}>
            <Card>
              <Text style={styles.cardMeta}>{t("profile.ideasEmpty")}</Text>
            </Card>
          </View>
        )}

        {/* Notes — only renders when present. Free-form context the
            user wrote about the person; will be field-encrypted
            before external testing per PRD §10. */}
        {person.notes != null && person.notes.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>{t("profile.notes")}</Label>
            <Card>
              <Text style={styles.notesText}>{person.notes}</Text>
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
            {t("profile.brainstormCta")}
          </Btn>
        </View>
      </ScrollView>
    </View>
  );
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
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  occasionRowPressed: {
    opacity: 0.6,
  },
  occasionEmpty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    paddingVertical: spacing.sm,
  },
  occasionEmptyAccent: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.md,
  },
  aboutKey: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    minWidth: 50,
  },
  aboutValue: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  notesText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
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
