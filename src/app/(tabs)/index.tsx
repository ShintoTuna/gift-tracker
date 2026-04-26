import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Label, PersonRow, ScreenTitle } from "@/components";
import { formatDateLine } from "@/lib/format";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function PeopleScreen() {
  const peopleWithNext = useQuery(api.people.listWithNextOccasion);

  const { thisWeek, upcoming } = useMemo(() => {
    if (!peopleWithNext) return { thisWeek: [], upcoming: [] };
    const now = Date.now();
    const horizon = now + ONE_WEEK_MS;
    const tw: typeof peopleWithNext = [];
    const up: typeof peopleWithNext = [];
    for (const person of peopleWithNext) {
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
  }, [peopleWithNext]);

  // Loading: query subscription not yet resolved.
  if (peopleWithNext === undefined) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  // Empty: no people seeded yet.
  if (peopleWithNext.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenTitle sub="Capture the people who matter">
            People
          </ScreenTitle>
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No one here yet. Tap the{" "}
              <Text style={styles.emptyAccent}>dev</Text> pill in the
              bottom-right to seed test data.
            </Text>
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
      >
        <ScreenTitle>People</ScreenTitle>

        {/* Search bar — visual placeholder. Wired in a later step. */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              placeholder="Search"
              placeholderTextColor={colors.text3}
              style={styles.searchInput}
              editable={false}
            />
          </View>
        </View>

        {thisWeek.length > 0 && (
          <View style={styles.section}>
            <Label tone="claret" style={styles.sectionLabel}>
              This week
            </Label>
            {thisWeek.map((person, idx) => (
              <PersonRow
                key={person._id}
                initial={person.name[0]?.toUpperCase() ?? "?"}
                name={person.name}
                relation={person.relationship}
                dateLine={dateLineFor(person)}
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
            <Label style={styles.sectionLabel}>Upcoming</Label>
            {upcoming.map((person, idx) => (
              <PersonRow
                key={person._id}
                initial={person.name[0]?.toUpperCase() ?? "?"}
                name={person.name}
                relation={person.relationship}
                dateLine={dateLineFor(person)}
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

function dateLineFor(person: EnrichedPerson): string {
  if (person.nextOccasion === null || person.nextOccasionDate === null) {
    return "No upcoming occasions";
  }
  return formatDateLine({
    occasionType: person.nextOccasion.type,
    customLabel: person.nextOccasion.customLabel,
    nextDate: person.nextOccasionDate,
  });
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
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text2,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
});
