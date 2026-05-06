import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Btn, Icon, Label, PersonRow, Pill, ScreenTitle } from "@/components";
import { formatDateLine } from "@/lib/format";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function PeopleScreen() {
  const { t } = useTranslation();
  const peopleWithNext = useQuery(api.people.listWithNextOccasion);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Convex is already reactive — pull-to-refresh is a UX gesture
  // affordance, not a real refetch. Toggle the spinner briefly so
  // the muscle memory works.
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const filtered = useMemo(() => {
    if (!peopleWithNext) return [];
    const q = search.trim().toLowerCase();
    if (q.length === 0) return peopleWithNext;
    return peopleWithNext.filter((p) => {
      const haystack = [p.name, p.nickname, p.relationship, ...p.interests]
        .filter((s): s is string => typeof s === "string")
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [peopleWithNext, search]);

  const { thisWeek, upcoming } = useMemo(() => {
    const now = Date.now();
    const horizon = now + ONE_WEEK_MS;
    const tw: typeof filtered = [];
    const up: typeof filtered = [];
    for (const person of filtered) {
      if (
        person.nextOccasionDate !== null &&
        person.nextOccasionDate <= horizon
      ) {
        tw.push(person);
      } else {
        up.push(person);
      }
    }
    return { thisWeek: tw, upcoming: up };
  }, [filtered]);

  // Loading: query subscription not yet resolved.
  if (peopleWithNext === undefined) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.brass} />
        </View>
      </SafeAreaView>
    );
  }

  // Empty: no people seeded yet.
  if (peopleWithNext.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <PeopleHeader sub={t("people.subtitle")} />
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              <Trans
                i18nKey="people.emptyAll"
                components={{ accent: <Text style={styles.emptyAccent} /> }}
              />
            </Text>
            <View style={styles.emptyCta}>
              <Btn
                tone="primary"
                full
                onPress={() => router.push("/people/new")}
              >
                {t("people.emptyCta")}
              </Btn>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brass}
          />
        }
      >
        <PeopleHeader />

        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              placeholder={t("people.search")}
              placeholderTextColor={colors.text3}
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {filtered.length === 0 && search.trim().length > 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              <Trans
                i18nKey="people.noMatches"
                values={{ query: search.trim() }}
                components={{ accent: <Text style={styles.emptyAccent} /> }}
              />
            </Text>
          </View>
        )}

        {thisWeek.length > 0 && (
          <View style={styles.section}>
            <Label tone="claret" style={styles.sectionLabel}>
              {t("people.thisWeek")}
            </Label>
            {thisWeek.map((person, idx) => (
              <PersonRow
                key={person._id}
                initial={person.name[0]?.toUpperCase() ?? "?"}
                imageUrl={person.photoUrl}
                name={person.name}
                relation={person.relationship}
                dateLine={dateLineFor(person, t)}
                ideas={person.ideaCount}
                urgent
                hideBorder={idx === thisWeek.length - 1}
                onPress={() =>
                  router.push({
                    pathname: "/people/[id]",
                    params: { id: person._id },
                  })
                }
              />
            ))}
          </View>
        )}

        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>{t("people.upcoming")}</Label>
            {upcoming.map((person, idx) => (
              <PersonRow
                key={person._id}
                initial={person.name[0]?.toUpperCase() ?? "?"}
                imageUrl={person.photoUrl}
                name={person.name}
                relation={person.relationship}
                dateLine={dateLineFor(person, t)}
                ideas={person.ideaCount}
                hideBorder={idx === upcoming.length - 1}
                onPress={() =>
                  router.push({
                    pathname: "/people/[id]",
                    params: { id: person._id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type EnrichedPerson = NonNullable<
  ReturnType<typeof useQuery<typeof api.people.listWithNextOccasion>>
>[number];

// Single-row header: gear icon (settings) + centered "People" title
// + brass-dashed "+ Person" pill. Title stays true-centered via
// ScreenTitle's absolute-positioned leading/trailing slots, so the
// chrome doesn't bias it left or right regardless of pill width.
function PeopleHeader({ sub }: { sub?: string }) {
  const { t } = useTranslation();
  return (
    <ScreenTitle
      sub={sub}
      leading={
        <Pressable
          onPress={() => router.push("/settings")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("people.openSettingsA11y")}
        >
          <Icon name="gearshape" size={22} color={colors.text2} />
        </Pressable>
      }
      trailing={
        <Pressable
          onPress={() => router.push("/people/new")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("people.addPersonA11y")}
        >
          <Pill tone="brass" dashed>
            {t("people.addPerson")}
          </Pill>
        </Pressable>
      }
    >
      {t("people.title")}
    </ScreenTitle>
  );
}

// Translator function passed in so this helper stays a pure function
// of (person, t). The parent screen owns the `useTranslation()` hook
// and re-runs this whenever the language changes.
type TFunc = ReturnType<typeof useTranslation>["t"];

function dateLineFor(person: EnrichedPerson, t: TFunc): string {
  if (person.nextOccasion !== null && person.nextOccasionDate !== null) {
    return formatDateLine({
      title: person.nextOccasion.title,
      nextDate: person.nextOccasionDate,
    });
  }
  if (person.hasDatelessOccasion) {
    // The person has at least one occasion whose date isn't known yet
    // (e.g., a friend's eventual housewarming). Surface the intent
    // even though we can't render a countdown.
    return t("people.pendingDate");
  }
  if (person.occasionCount > 0) {
    // Every occasion has a date but they've all passed — no upcoming
    // events on the horizon.
    return t("people.noUpcomingDates");
  }
  return t("people.noUpcomingOccasions");
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.text3,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  empty: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text2,
    lineHeight: 22,
  },
  emptyAccent: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
  },
  emptyCta: {
    marginTop: spacing.xl,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
