import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type Recurrence = "yearly" | "one_off";

// Modal-presented edit screen for an existing occasion. Loads the
// row by id, pre-populates the form, and supports save + delete.
// Mirrors `occasion/new.tsx` for the form layout — the differences
// are init-from-loaded-row and the Delete affordance.
export default function EditOccasionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const occasionId = id as Id<"occasions">;
  const occasion = useQuery(api.occasions.getById, { id: occasionId });
  const updateOccasion = useMutation(api.occasions.update);
  const removeOccasion = useMutation(api.occasions.remove);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [recurrence, setRecurrence] = useState<Recurrence>("yearly");
  const [saving, setSaving] = useState(false);

  // Re-init only when the route id changes — not when the row
  // refreshes — so in-progress edits aren't clobbered by reactive
  // subscription updates.
  useEffect(() => {
    if (occasion) {
      setTitle(occasion.title);
      setDate(occasion.date != null ? new Date(occasion.date) : null);
      setRecurrence(occasion.recurrence ?? "yearly");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occasion?._id]);

  if (occasion === undefined) {
    return (
      <View style={styles.root}>
        <NavBar
          title="Edit occasion"
          leading="close"
          onLeadingPress={() => router.back()}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.brass} />
        </View>
      </View>
    );
  }

  if (occasion === null) {
    return (
      <View style={styles.root}>
        <NavBar
          title="Edit occasion"
          leading="close"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>Occasion not found.</Text>
      </View>
    );
  }

  const canSave = title.trim().length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateOccasion({
        id: occasionId,
        patch: {
          title: title.trim(),
          date: date != null ? date.getTime() : undefined,
          recurrence: date != null ? recurrence : undefined,
        },
      });
      router.back();
    } catch (err) {
      Alert.alert(
        "Could not save",
        err instanceof Error ? err.message : String(err),
      );
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert("Delete this occasion?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeOccasion({ id: occasionId });
            router.back();
          } catch (err) {
            Alert.alert(
              "Could not delete",
              err instanceof Error ? err.message : String(err),
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <NavBar
        title="Edit occasion"
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
          <ScreenTitle>Edit occasion</ScreenTitle>

          <View style={styles.fields}>
            <TextField
              label="Title"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />

            <DatePicker value={date} onChange={setDate} />

            {date != null && (
              <View>
                <Label style={styles.recurrenceLabel}>Recurrence</Label>
                <View style={styles.recurrenceRow}>
                  <Pressable
                    onPress={() => setRecurrence("yearly")}
                    hitSlop={4}
                  >
                    <Pill tone={recurrence === "yearly" ? "brass" : "default"}>
                      Yearly
                    </Pill>
                  </Pressable>
                  <Pressable
                    onPress={() => setRecurrence("one_off")}
                    hitSlop={4}
                  >
                    <Pill
                      tone={recurrence === "one_off" ? "brass" : "default"}
                    >
                      One-off
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
              {saving ? "Saving…" : "Save"}
            </Btn>

            <Btn
              tone="danger"
              full
              onPress={onDelete}
              style={styles.deleteBtn}
            >
              Delete occasion
            </Btn>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  deleteBtn: {
    marginTop: spacing.sm,
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
});
