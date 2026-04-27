import { useMutation } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { Btn, NavBar, ScreenTitle, TextField } from "@/components";
import { colors, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";

// Modal-presented form. NavBar X dismisses; primary brass Save runs
// the people.create mutation and pops back. List updates reactively
// via Convex subscription — no manual refresh needed.
export default function NewPersonScreen() {
  const createPerson = useMutation(api.people.create);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [relationship, setRelationship] = useState("");
  const [interestsText, setInterestsText] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const interests = interestsText
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      await createPerson({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        relationship: relationship.trim() || undefined,
        interests,
        notes: notes.trim() || undefined,
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

  return (
    <View style={styles.root}>
      <NavBar
        title="New person"
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
          <ScreenTitle sub="Someone you want to remember">
            Who are we adding?
          </ScreenTitle>

          <View style={styles.fields}>
            <TextField
              label="Name"
              placeholder="Required"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              returnKeyType="next"
            />
            <TextField
              label="Nickname"
              placeholder="Optional"
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextField
              label="Relationship"
              hint="Free text — e.g., mom, best friend, colleague"
              placeholder="Optional"
              value={relationship}
              onChangeText={setRelationship}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextField
              label="Interests"
              hint="Comma-separated"
              placeholder="e.g., gardening, audiobooks, tea"
              value={interestsText}
              onChangeText={setInterestsText}
              autoCapitalize="none"
              autoCorrect
              returnKeyType="next"
            />
            <TextField
              label="Notes"
              placeholder="Optional"
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
              {saving ? "Saving…" : "Save"}
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
});
