import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
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
  Label,
  NavBar,
  PeoplePicker,
  Pill,
  ScreenTitle,
  TextField,
} from "@/components";
import type { IdeaStatus } from "@/components/IdeaCard";
import { DEFAULT_CURRENCY } from "@/lib/settings";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const STATUSES: IdeaStatus[] = ["idea", "given"];
const STATUS_LABEL: Record<IdeaStatus, string> = {
  idea: "Open",
  given: "Given",
};

// Modal-presented edit screen for a single gift idea. Mirrors the
// Capture form (Idea / Source / Price / People / Description) and
// adds a Status picker plus a Delete affordance. Save runs the
// update mutation; Delete runs remove (with an Alert confirmation).
export default function EditIdeaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ideaId = id as Id<"giftIdeas">;
  const idea = useQuery(api.giftIdeas.getById, { id: ideaId });
  const people = useQuery(api.people.list);
  const updateIdea = useMutation(api.giftIdeas.update);
  const removeIdea = useMutation(api.giftIdeas.remove);

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [priceText, setPriceText] = useState("");
  const [description, setDescription] = useState("");
  const [taggedIds, setTaggedIds] = useState<Id<"people">[]>([]);
  const [status, setStatus] = useState<IdeaStatus>("idea");
  const [saving, setSaving] = useState(false);

  // Initialize form once the idea loads. Re-init only when the route
  // id changes — not when the idea row itself updates, which would
  // clobber in-progress edits if a reactive subscription refreshed.
  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setSourceUrl(idea.sourceUrl ?? "");
      setPriceText(
        idea.priceEstimate != null ? String(idea.priceEstimate) : "",
      );
      setDescription(idea.description ?? "");
      setTaggedIds(idea.taggedPeople);
      setStatus(idea.status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?._id]);

  if (idea === undefined) {
    return (
      <View style={styles.root}>
        <NavBar
          title="Edit idea"
          leading="close"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (idea === null) {
    return (
      <View style={styles.root}>
        <NavBar
          title="Edit idea"
          leading="close"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>Idea not found.</Text>
      </View>
    );
  }

  const canSave = title.trim().length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const parsedPrice = priceText.trim().length
        ? Number.parseFloat(priceText.replace(",", "."))
        : undefined;
      const priceEstimate =
        parsedPrice != null && Number.isFinite(parsedPrice)
          ? parsedPrice
          : undefined;
      await updateIdea({
        id: ideaId,
        patch: {
          title: title.trim(),
          description: description.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          priceEstimate,
          currency:
            priceEstimate !== undefined ? DEFAULT_CURRENCY : undefined,
          taggedPeople: taggedIds,
          status,
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
    Alert.alert("Delete this gift idea?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeIdea({ id: ideaId });
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
        title="Edit idea"
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
          <ScreenTitle>Edit idea</ScreenTitle>

          <View style={styles.fields}>
            <TextField
              label="Idea"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
              autoCorrect
              returnKeyType="next"
            />

            <TextField
              label="Source"
              placeholder="https://…"
              value={sourceUrl}
              onChangeText={setSourceUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <TextField
              label={`Price (${DEFAULT_CURRENCY})`}
              placeholder="Optional"
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />

            <PeoplePicker
              people={people ?? []}
              selectedIds={taggedIds}
              onChange={setTaggedIds}
            />

            <View>
              <Label style={styles.statusLabel}>Status</Label>
              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    hitSlop={4}
                  >
                    <Pill tone={status === s ? "brass" : "default"}>
                      {STATUS_LABEL[s]}
                    </Pill>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextField
              label="Description"
              placeholder="Optional"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.descriptionInput}
              autoCapitalize="sentences"
              autoCorrect
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

            <Btn
              tone="danger"
              full
              onPress={onDelete}
              style={styles.deleteBtn}
            >
              Delete idea
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
  statusLabel: {
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  descriptionInput: {
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
});
