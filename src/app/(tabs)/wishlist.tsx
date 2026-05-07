import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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

import { Btn, IdeaCard, Pill, ScreenTitle } from "@/components";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type Filter = "active" | "archived";
const FILTERS: { value: Filter; key: "filterActive" | "filterArchived" }[] = [
  { value: "active", key: "filterActive" },
  { value: "archived", key: "filterArchived" },
];

// Wish List — the "for me" companion to the Gifts backlog. Lists
// every idea the user has flagged `forSelf: true` (server-filtered
// via the `by_user_forSelf` index). An idea tagged to someone *and*
// marked `forSelf` appears on both tabs, which is intentional.
//
// The "+" FAB opens the same Quick Capture form as everywhere else,
// but pre-flips the "Also for me" toggle when launched from this
// tab (or from the empty-state CTA below).
export default function WishlistScreen() {
  const { t } = useTranslation();
  const ideas = useQuery(api.giftIdeas.listByUserForSelf);
  const people = useQuery(api.people.list);
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

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
    let result = [...ideas].sort((a, b) => b.updatedAt - a.updatedAt);
    result = result.filter((i) => i.status === filter);
    const q = search.trim().toLowerCase();
    if (q.length > 0) {
      result = result.filter((i) => {
        const haystack = [i.title, i.description]
          .filter((s): s is string => typeof s === "string")
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return result;
  }, [ideas, filter, search]);

  if (ideas === undefined) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.brass} />
        </View>
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
        <ScreenTitle sub={t("wishlist.subtitle")}>
          {t("wishlist.title")}
        </ScreenTitle>

        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              placeholder={t("wishlist.search")}
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

        <View style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t(`backlog.${f.key}`)}
              accessibilityState={{ selected: filter === f.value }}
            >
              <Pill tone={filter === f.value ? "brass" : "default"}>
                {t(`backlog.${f.key}`)}
              </Pill>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {ideas.length === 0
                ? t("wishlist.emptyNone")
                : search.trim().length > 0
                  ? t("backlog.emptySearch", { query: search.trim() })
                  : t("backlog.emptyFilter")}
            </Text>
            {ideas.length === 0 && (
              <View style={styles.emptyCta}>
                <Btn
                  tone="primary"
                  full
                  onPress={() =>
                    router.push({
                      pathname: "/capture",
                      params: { forSelf: "1" },
                    })
                  }
                >
                  {t("wishlist.emptyCta")}
                </Btn>
              </View>
            )}
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
                  description={idea.description}
                  peopleInitials={initials.length > 0 ? initials : undefined}
                  imageUrl={idea.imageUrl}
                  placeholderSeed={idea._id}
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
  searchWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
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
  emptyCta: {
    marginTop: spacing.xl,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
