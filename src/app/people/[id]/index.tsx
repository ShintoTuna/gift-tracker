import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
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
  Icon,
  IdeaCard,
  Label,
  NavBar,
  Pill,
} from "@/components";
import {
  formatOccasionLine,
  formatRelativeDays,
} from "@/lib/format";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatGivenCaption(
  t: (key: string, vars?: Record<string, unknown>) => string,
  givenAt: number,
  occasionTitle: string | null,
): string {
  const date = dateFormatter.format(new Date(givenAt));
  return occasionTitle
    ? t("profile.givenCaptionWithOccasion", { date, occasion: occasionTitle })
    : t("profile.givenCaption", { date });
}

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

  const { person, occasions, consideredIdeas, givenIdeas } = profile;
  const openIdea = (ideaId: Id<"giftIdeas">) =>
    router.push({
      pathname: "/idea/[id]",
      params: { id: ideaId },
    });
  const openCaptureForPerson = () =>
    router.push({
      pathname: "/capture",
      params: { personId: person._id },
    });

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
            imageUrl={person.photoUrl}
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Label>{t("profile.occasions")}</Label>
            {occasions.length > 0 && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/occasion/new",
                    params: { personId: person._id },
                  })
                }
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t("profile.addOccasion")}
              >
                <Pill tone="brass" dashed>
                  {t("profile.addOccasion")}
                </Pill>
              </Pressable>
            )}
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
                    accessibilityRole="button"
                    accessibilityLabel={occ.title}
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
            <Card>
              <View style={styles.occasionEmptyCard}>
                <View style={styles.occasionEmptyIcon}>
                  <Icon
                    name="calendar"
                    color={colors.brass}
                    size={22}
                    weight="medium"
                  />
                </View>
                <Text style={styles.occasionEmptyHeadline}>
                  {t("profile.occasionsEmptyHeadline")}
                </Text>
                <Text style={styles.occasionEmptyBody}>
                  {t("profile.occasionsEmptyBody")}
                </Text>
                <Btn
                  tone="primary"
                  full
                  onPress={() =>
                    router.push({
                      pathname: "/occasion/new",
                      params: { personId: person._id },
                    })
                  }
                  style={styles.occasionEmptyCta}
                >
                  {t("profile.addOccasionCta")}
                </Btn>
              </View>
            </Card>
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

        {/* Considered for {name} — tagged, not yet given to this person */}
        {consideredIdeas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Label>
                {t("profile.consideredIdeas", {
                  count: consideredIdeas.length,
                })}
              </Label>
              <Pressable
                onPress={openCaptureForPerson}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t("profile.addIdea")}
              >
                <Pill tone="brass" dashed>
                  {t("profile.addIdea")}
                </Pill>
              </Pressable>
            </View>
            <View style={styles.cardStack}>
              {consideredIdeas.map((idea) => (
                <IdeaCard
                  key={idea._id}
                  title={idea.title}
                  description={idea.description}
                  peopleInitials={otherInitials(
                    idea.taggedPeopleInitials,
                    person.name,
                  )}
                  imageUrl={idea.imageUrl}
                  placeholderSeed={idea._id}
                  onPress={() => openIdea(idea._id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Given to {name} — one row per idea, most recent giving */}
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
                  description={idea.description}
                  imageUrl={idea.imageUrl}
                  placeholderSeed={idea._id}
                  caption={formatGivenCaption(
                    t,
                    idea.latestGivenAt,
                    idea.latestOccasionTitle,
                  )}
                  onPress={() => openIdea(idea._id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty-state hint when there's nothing yet */}
        {consideredIdeas.length === 0 && givenIdeas.length === 0 && (
          <View style={styles.section}>
            <Card>
              <View style={styles.occasionEmptyCard}>
                <View style={styles.occasionEmptyIcon}>
                  <Icon
                    name="gift"
                    color={colors.brass}
                    size={22}
                    weight="medium"
                  />
                </View>
                <Text style={styles.occasionEmptyHeadline}>
                  {t("profile.ideasEmptyHeadline")}
                </Text>
                <Text style={styles.occasionEmptyBody}>
                  {t("profile.ideasEmptyBody")}
                </Text>
                <Btn
                  tone="primary"
                  full
                  onPress={openCaptureForPerson}
                  style={styles.occasionEmptyCta}
                >
                  {t("profile.addIdeaCta")}
                </Btn>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// AvatarStack initials excluding the current profile person — show
// "this idea is also for ..." rather than redundant self-reference.
// Returns undefined when there's no one else to show, so the card
// drops the avatar slot entirely.
function otherInitials(
  taggedInitials: readonly string[],
  currentName: string,
): string[] | undefined {
  const currentInitial = currentName[0]?.toUpperCase() ?? "?";
  // Drop a single occurrence of the current person's initial. With a
  // denormalized initials list we can't perfectly distinguish two
  // people who share an initial — best-effort is good enough for an
  // avatar stack.
  const filtered = [...taggedInitials];
  const idx = filtered.indexOf(currentInitial);
  if (idx >= 0) filtered.splice(idx, 1);
  return filtered.length > 0 ? filtered : undefined;
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
  occasionEmptyCard: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  occasionEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(200, 164, 90, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  occasionEmptyHeadline: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  occasionEmptyBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    textAlign: "center",
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  occasionEmptyCta: {
    marginTop: spacing.lg,
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
