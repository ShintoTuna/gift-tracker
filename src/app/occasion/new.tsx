import { useMutation } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  Btn,
  DatePicker,
  KeyboardForm,
  Label,
  NavBar,
  Pill,
  ScreenTitle,
  TextField,
} from "@/components";
import { useLimitErrorSheet } from "@/lib/useLimitErrorSheet";
import { colors, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Quick-fill templates for the title field. The list is locale-driven
// (occasionForm.templates is a comma-separated string) so each language
// can ship the occasions that are culturally relevant — e.g. 8 марта /
// 23 февраля in Russian rather than translating Mother's Day literally.

// Modal-presented "new occasion" form. Reached via the Profile
// screen's "+ Add" affordance, which passes the parent `personId`
// through search params. Title is the only required field; date and
// recurrence are optional (per the typing brainstorm — "TBD"
// occasions are first-class).
export default function NewOccasionScreen() {
  const { t } = useTranslation();
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const createOccasion = useMutation(api.occasions.create);
  const { handleError, sheet: limitSheet } = useLimitErrorSheet();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [recurrence, setRecurrence] = useState<"yearly" | "one_off">("yearly");
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && !saving;

  const titleTemplates = t("occasionForm.templates")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await createOccasion({
        personId: personId as Id<"people">,
        title: title.trim(),
        date: date != null ? date.getTime() : undefined,
        // Recurrence is meaningless without a date; only persist it
        // when a date is actually set.
        recurrence: date != null ? recurrence : undefined,
      });
      router.back();
    } catch (err) {
      handleError(err, t("common.couldNotSave"));
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <NavBar
        title={t("occasionForm.newTitle")}
        leading="close"
        onLeadingPress={() => router.back()}
      />
      <KeyboardForm>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle sub={t("occasionForm.newSubtitle")}>
            {t("occasionForm.newScreenTitle")}
          </ScreenTitle>

          <View style={styles.fields}>
            <View>
              <TextField
                label={t("occasionForm.titleLabel")}
                placeholder={t("occasionForm.titlePlaceholder")}
                value={title}
                onChangeText={setTitle}
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
              <View style={styles.templates}>
                {titleTemplates.map((label) => (
                  <Pressable
                    key={label}
                    onPress={() => setTitle(label)}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                  >
                    <Pill tone="default" dashed>
                      {label}
                    </Pill>
                  </Pressable>
                ))}
              </View>
            </View>

            <DatePicker value={date} onChange={setDate} />

            {date != null && (
              <View>
                <Label style={styles.recurrenceLabel}>
                  {t("occasionForm.recurrence")}
                </Label>
                <View style={styles.recurrenceRow}>
                  <Pressable
                    onPress={() => setRecurrence("yearly")}
                    hitSlop={4}
                  >
                    <Pill tone={recurrence === "yearly" ? "brass" : "default"}>
                      {t("occasionForm.recurrenceYearly")}
                    </Pill>
                  </Pressable>
                  <Pressable
                    onPress={() => setRecurrence("one_off")}
                    hitSlop={4}
                  >
                    <Pill
                      tone={recurrence === "one_off" ? "brass" : "default"}
                    >
                      {t("occasionForm.recurrenceOneOff")}
                    </Pill>
                  </Pressable>
                </View>
              </View>
            )}

            <Btn
              tone="primary"
              full
              disabled={!canSave}
              onPress={onSave}
              style={styles.saveBtn}
            >
              {saving ? t("common.saving") : t("common.save")}
            </Btn>
          </View>
        </ScrollView>
      </KeyboardForm>
      {limitSheet}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  fields: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  recurrenceLabel: {
    marginBottom: spacing.sm,
  },
  recurrenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  templates: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saveBtn: {
    marginTop: spacing.md,
  },
});
