import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Btn,
  MonthDayPicker,
  NavBar,
  ScreenTitle,
  TextField,
} from "@/components";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

// Modal-presented edit screen for a person. Mirrors the add-person
// form, pre-populated from the loaded row, plus a Delete affordance.
// Delete cascades to occasions and detags from gift ideas (already
// handled in `people.remove`).
export default function EditPersonScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = id as Id<"people">;
  const person = useQuery(api.people.getById, { id: personId });
  const updatePerson = useMutation(api.people.update);
  const removePerson = useMutation(api.people.remove);

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [relationship, setRelationship] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [interestsText, setInterestsText] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize once the row loads. Re-init only when the route id
  // changes — not on reactive refreshes — so in-progress edits
  // aren't clobbered.
  useEffect(() => {
    if (person) {
      setName(person.name);
      setNickname(person.nickname ?? "");
      setRelationship(person.relationship ?? "");
      setBirthDate(
        person.dateOfBirth != null ? new Date(person.dateOfBirth) : null,
      );
      setInterestsText(person.interests.join(", "));
      setNotes(person.notes ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person?._id]);

  if (person === undefined) {
    return (
      <View style={styles.root}>
        <NavBar
          title={t("personForm.editTitle")}
          leading="close"
          onLeadingPress={() => router.back()}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.brass} />
        </View>
      </View>
    );
  }

  if (person === null) {
    return (
      <View style={styles.root}>
        <NavBar
          title={t("personForm.editTitle")}
          leading="close"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>{t("personForm.notFound")}</Text>
      </View>
    );
  }

  const canSave = name.trim().length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const interests = interestsText
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const dateOfBirth =
        birthDate != null
          ? Date.UTC(2000, birthDate.getUTCMonth(), birthDate.getUTCDate())
          : undefined;
      await updatePerson({
        id: personId,
        patch: {
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          relationship: relationship.trim() || undefined,
          interests,
          notes: notes.trim() || undefined,
          dateOfBirth,
        },
      });
      router.back();
    } catch (err) {
      Alert.alert(
        t("common.couldNotSave"),
        err instanceof Error ? err.message : String(err),
      );
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert(
      t("personForm.deleteConfirmTitle"),
      t("personForm.deleteConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await removePerson({ id: personId });
              // Dismiss any open modals (this one), then replace the
              // stack root so we don't briefly render the now-deleted
              // profile en route to the People tab.
              router.dismissAll();
              router.replace("/");
            } catch (err) {
              Alert.alert(
                t("common.couldNotDelete"),
                err instanceof Error ? err.message : String(err),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <NavBar
        title={t("personForm.editTitle")}
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
          <ScreenTitle>{t("personForm.editScreenTitle")}</ScreenTitle>

          <View style={styles.fields}>
            <TextField
              label={t("personForm.name")}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextField
              label={t("personForm.nickname")}
              placeholder={t("common.optional")}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextField
              label={t("personForm.relationship")}
              hint={t("personForm.relationshipHint")}
              placeholder={t("common.optional")}
              value={relationship}
              onChangeText={setRelationship}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <MonthDayPicker
              label={t("personForm.birthDate")}
              value={birthDate}
              onChange={setBirthDate}
            />
            <TextField
              label={t("personForm.interests")}
              hint={t("personForm.interestsHint")}
              placeholder={t("personForm.interestsPlaceholder")}
              value={interestsText}
              onChangeText={setInterestsText}
              autoCapitalize="none"
              autoCorrect
              returnKeyType="next"
            />
            <TextField
              label={t("personForm.notes")}
              placeholder={t("common.optional")}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
              returnKeyType="default"
            />

            <Btn
              tone="primary"
              full
              disabled={!canSave}
              onPress={onSave}
              style={styles.saveBtn}
            >
              {saving ? t("common.saving") : t("common.save")}
            </Btn>

            <Btn
              tone="danger"
              full
              onPress={onDelete}
              style={styles.deleteBtn}
            >
              {t("personForm.deleteButton")}
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
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
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
