import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IdeaCard, Pill, ScreenTitle } from "@/components";
import { formatPrice, shortenSource } from "@/lib/format";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type Filter = "all" | "open" | "given";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "given", label: "Given" },
];

// User-facing label is "Gifts" (file stays `backlog.tsx` — internal
// shorthand that pairs with the schema/concept).
//
// Lists every captured idea; tap a card to edit at /idea/[id].
// Status filter pills at the top: All / Open (idea | planned |
// purchased) / Given.
export default function GiftsScreen() {
  const ideas = useQuery(api.giftIdeas.listByUser);
  const people = useQuery(api.people.list);
  const [filter, setFilter] = useState<Filter>("all");

  // Lookup map: person id → first letter, for IdeaCard avatar stacks.
  // Built once per render of this component.
  const initialsByPersonId = useMemo(() => {
    const map = new Map<Id<"people">, string>();
    if (people) {
      for (const p of people) {
        map.set(p._id, p.name[0]?.toUpperCase() ?? "?");
      }
    }
    return map;
  }, [people]);

  const filtered = useMemo(() => {
    if (!ideas) return [];
    const sorted = [...ideas].sort((a, b) => b.updatedAt - a.updatedAt);
    if (filter === "all") return sorted;
    if (filter === "given") return sorted.filter((i) => i.status === "given");
    return sorted.filter((i) => i.status !== "given");
  }, [ideas, filter]);

  if (ideas === undefined) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle>Gifts</ScreenTitle>

        <View style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              hitSlop={6}
            >
              <Pill tone={filter === f.value ? "brass" : "default"}>
                {f.label}
              </Pill>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {ideas.length === 0
                ? "No ideas captured yet. Tap the + button to capture your first."
                : "No ideas match this filter."}
            </Text>
          </View>
        ) : (
          <View style={styles.ideaList}>
            {filtered.map((idea) => {
              const initials = idea.taggedPeople
                .map((id) => initialsByPersonId.get(id))
                .filter((s): s is string => s != null);
              return (
                <IdeaCard
                  key={idea._id}
                  title={idea.title}
                  source={shortenSource(idea.sourceUrl)}
                  price={formatPrice(idea.priceEstimate, idea.currency)}
                  peopleInitials={initials.length > 0 ? initials : undefined}
                  status={idea.status}
                  onPress={() =>
                    router.push({
                      pathname: "/idea/[id]",
                      params: { id: idea._id },
                    })
                  }
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  ideaList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
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
    textAlign: "center",
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text2,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
});
