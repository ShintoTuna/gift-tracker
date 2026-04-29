import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Label, PersonRow, ScreenTitle } from "@/components";
import {
  formatMonthLabel,
  formatRelativeDays,
} from "@/lib/format";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type AgendaItem = NonNullable<
  ReturnType<typeof useQuery<typeof api.occasions.listUpcoming>>
>[number];

type MonthGroup = { key: string; label: string; items: AgendaItem[] };

// Calendar tab — agenda-style timeline of every upcoming occasion
// across every person. Grouped: "This week" (claret), monthly
// buckets, "Pending dates" (truly dateless). Each row reuses
// PersonRow with the occasion as the headline and the person as the
// subtitle; tap → person profile.
export default function CalendarScreen() {
  const { t } = useTranslation();
  const items = useQuery(api.occasions.listUpcoming);
  const [refreshing, setRefreshing] = useState(false);

  // Convex is reactive; pull-to-refresh is a UX gesture only.
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const grouped = useMemo(() => groupItems(items ?? []), [items]);

  if (items === undefined) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.brass} />
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenTitle>{t("calendar.title")}</ScreenTitle>
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t("calendar.empty")}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { thisWeek, monthGroups, pending } = grouped;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brass}
          />
        }
      >
        <ScreenTitle>{t("calendar.title")}</ScreenTitle>

        {thisWeek.length > 0 && (
          <Section
            label={t("calendar.thisWeek")}
            tone="claret"
            items={thisWeek}
            urgent
          />
        )}

        {monthGroups.map((group) => (
          <Section key={group.key} label={group.label} items={group.items} />
        ))}

        {pending.length > 0 && (
          <Section label={t("calendar.pendingDates")} items={pending} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  label,
  tone,
  items,
  urgent,
}: {
  label: string;
  tone?: "claret";
  items: AgendaItem[];
  urgent?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Label
        tone={tone === "claret" ? "claret" : "default"}
        style={styles.sectionLabel}
      >
        {label}
      </Label>
      {items.map((item, idx) => (
        <PersonRow
          key={item.occasion._id}
          initial={item.person.name[0]?.toUpperCase() ?? "?"}
          imageUrl={item.person.photoUrl}
          name={item.occasion.title}
          relation={item.person.nickname ?? item.person.name}
          dateLine={
            item.nextDate !== null
              ? formatRelativeDays(item.nextDate)
              : t("format.dateTBD")
          }
          ideas={item.ideaCount}
          urgent={urgent}
          hideBorder={idx === items.length - 1}
          onPress={() =>
            router.push({
              pathname: "/people/[id]",
              params: { id: item.person._id },
            })
          }
        />
      ))}
    </View>
  );
}

function groupItems(items: AgendaItem[]) {
  const now = Date.now();
  const horizon = now + ONE_WEEK_MS;

  const thisWeek: AgendaItem[] = [];
  const pending: AgendaItem[] = [];
  const byMonth = new Map<string, AgendaItem[]>();

  for (const item of items) {
    if (item.nextDate === null) {
      pending.push(item);
      continue;
    }
    if (item.nextDate <= horizon) {
      thisWeek.push(item);
      continue;
    }
    const date = new Date(item.nextDate);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const list = byMonth.get(key) ?? [];
    list.push(item);
    byMonth.set(key, list);
  }

  const monthGroups: MonthGroup[] = Array.from(byMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, groupItems]) => ({
      key,
      label: formatMonthLabel(key),
      items: groupItems,
    }));

  return { thisWeek, monthGroups, pending };
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
    textAlign: "center",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
