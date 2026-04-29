import { useMutation } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  Btn,
  DatePicker,
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle sub={t("occasionForm.newSubtitle")}>
            {t("occasionForm.newScreenTitle")}
          </ScreenTitle>

          <View style={styles.fields}>
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
      </KeyboardAvoidingView>
      {limitSheet}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: { flex: 1 },
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
  saveBtn: {
    marginTop: spacing.md,
  },
});
