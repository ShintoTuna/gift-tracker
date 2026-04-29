import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";

import type { Id } from "../../convex/_generated/dataModel";
import { Label } from "./Label";
import { PersonChip } from "./PersonChip";
import { PersonSuggestRow } from "./PersonSuggestRow";

type Person = {
  _id: Id<"people">;
  name: string;
  nickname?: string;
  relationship?: string;
  photoUrl?: string | null;
};

type Props = {
  // When omitted, falls back to t("personPicker.label") so the
  // default copy stays localized. Pass a custom label for a
  // non-default header.
  label?: string;
  // Cap on how many suggestion rows to show at once. Anything beyond
  // this is reachable by typing into the search input. Default 5.
  maxSuggestions?: number;
  people: Person[];
  selectedIds: Id<"people">[];
  onChange: (next: Id<"people">[]) => void;
};

// Selected chips at the top, search input below, filtered suggestion
// rows beneath. The pattern from the v3 design's Quick Capture
// "For" block — scales to many people because typing filters the
// list, unlike a horizontal-scrolling pile of chips.
export function PeoplePicker({
  label,
  maxSuggestions = 5,
  people,
  selectedIds,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("personPicker.label");
  const [search, setSearch] = useState("");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selected = useMemo(
    () => people.filter((p) => selectedSet.has(p._id)),
    [people, selectedSet],
  );

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const candidates = people.filter((p) => !selectedSet.has(p._id));
    if (q.length === 0) return candidates;
    return candidates.filter((p) => {
      const haystack = [p.name, p.nickname, p.relationship]
        .filter((s): s is string => typeof s === "string")
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [people, selectedSet, search]);

  const visibleSuggestions = suggestions.slice(0, maxSuggestions);
  const overflow = suggestions.length - visibleSuggestions.length;

  const add = (id: Id<"people">) => {
    onChange([...selectedIds, id]);
    setSearch("");
  };

  const remove = (id: Id<"people">) => {
    onChange(selectedIds.filter((s) => s !== id));
  };

  if (people.length === 0) {
    return (
      <View>
        <Label style={styles.label}>{resolvedLabel}</Label>
        <Text style={styles.empty}>{t("personPicker.noPeople")}</Text>
      </View>
    );
  }

  return (
    <View>
      <Label style={styles.label}>{resolvedLabel}</Label>

      {selected.length > 0 && (
        <View style={styles.selectedRow}>
          {selected.map((p) => (
            <PersonChip
              key={p._id}
              initial={p.name[0]?.toUpperCase() ?? "?"}
              name={p.nickname ?? p.name}
              onRemove={() => remove(p._id)}
            />
          ))}
        </View>
      )}

      <TextInput
        placeholder={t("personPicker.placeholder")}
        placeholderTextColor={colors.text3}
        selectionColor={colors.brass}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />

      {visibleSuggestions.length > 0 ? (
        <View style={styles.suggestList}>
          {visibleSuggestions.map((p) => (
            <PersonSuggestRow
              key={p._id}
              initial={p.name[0]?.toUpperCase() ?? "?"}
              imageUrl={p.photoUrl}
              name={p.name}
              relationship={p.relationship}
              onPress={() => add(p._id)}
            />
          ))}
          {overflow > 0 && (
            <Text style={styles.overflow}>
              {t("personPicker.moreOverflow", { count: overflow })}
            </Text>
          )}
        </View>
      ) : (
        search.trim().length > 0 && (
          <Text style={styles.empty}>
            {t("personPicker.noMatches", { query: search.trim() })}
          </Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  selectedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  suggestList: {
    marginTop: spacing.sm,
    gap: 2,
  },
  overflow: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    paddingTop: spacing.sm,
  },
});
