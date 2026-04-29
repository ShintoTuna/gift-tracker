import { useAction, useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  ImagePickerField,
  Label,
  NavBar,
  PeoplePicker,
  Pill,
  ScreenTitle,
  TextField,
} from "@/components";
import type { IdeaStatus } from "@/components/IdeaCard";
import { describeMutationError } from "@/lib/convexErrors";
import { pickCompressUpload, type PickSource } from "@/lib/imageUpload";
import { useDefaultCurrency } from "@/lib/settings";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const STATUSES: IdeaStatus[] = ["idea", "given"];
const STATUS_KEY: Record<IdeaStatus, "ideaForm.statusOpen" | "ideaForm.statusGiven"> = {
  idea: "ideaForm.statusOpen",
  given: "ideaForm.statusGiven",
};

// Same tri-state shape as the person edit form. See the comment in
// src/app/people/[id]/edit.tsx for the rationale.
type ImageState =
  | { kind: "unchanged" }
  | { kind: "set"; storageId: Id<"_storage">; previewUri: string }
  | { kind: "removed" };

// Modal-presented edit screen for a single gift idea. Mirrors the
// Capture form (Idea / Source / Price / People / Description) and
// adds a Status picker plus a Delete affordance. Save runs the
// update mutation; Delete runs remove (with an Alert confirmation).
export default function EditIdeaScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ideaId = id as Id<"giftIdeas">;
  const idea = useQuery(api.giftIdeas.getById, { id: ideaId });
  const people = useQuery(api.people.list);
  const updateIdea = useMutation(api.giftIdeas.update);
  const removeIdea = useMutation(api.giftIdeas.remove);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const fetchImageFromUrl = useAction(api.imageFromUrl.fetchFromUrl);
  const defaultCurrency = useDefaultCurrency();

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [priceText, setPriceText] = useState("");
  const [description, setDescription] = useState("");
  const [taggedIds, setTaggedIds] = useState<Id<"people">[]>([]);
  const [status, setStatus] = useState<IdeaStatus>("idea");
  const [image, setImage] = useState<ImageState>({ kind: "unchanged" });
  const [uploading, setUploading] = useState(false);
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
      setImage({ kind: "unchanged" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?._id]);

  const onPickImage = async (source: PickSource) => {
    if (uploading) return;
    setUploading(true);
    try {
      const result = await pickCompressUpload({
        generateUploadUrl: () => generateUploadUrl({}),
        source,
      });
      if (result) {
        setImage({
          kind: "set",
          storageId: result.storageId,
          previewUri: result.previewUri,
        });
      }
    } catch (err) {
      Alert.alert(
        t("imagePicker.uploadFailed"),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setUploading(false);
    }
  };

  const onRemoveImage = () => {
    setImage({ kind: "removed" });
  };

  const onFetchImageFromSource = async () => {
    const url = sourceUrl.trim();
    if (!url || uploading) return;
    setUploading(true);
    try {
      const result = await fetchImageFromUrl({ url });
      setImage({
        kind: "set",
        storageId: result.storageId,
        previewUri: result.previewUrl ?? "",
      });
    } catch (err) {
      Alert.alert(
        t("imagePicker.fetchFromSourceFailed"),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setUploading(false);
    }
  };

  if (idea === undefined) {
    return (
      <View style={styles.root}>
        <NavBar
          title={t("ideaForm.editTitle")}
          leading="close"
          onLeadingPress={() => router.back()}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.brass} />
        </View>
      </View>
    );
  }

  if (idea === null) {
    return (
      <View style={styles.root}>
        <NavBar
          title={t("ideaForm.editTitle")}
          leading="close"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>{t("ideaForm.notFound")}</Text>
      </View>
    );
  }

  const canSave = title.trim().length > 0 && !saving && !uploading;
  const hasImage =
    image.kind === "set" ||
    (image.kind === "unchanged" && !!idea.imageUrl);
  const showFetchFromSource =
    sourceUrl.trim().length > 0 && !uploading && !hasImage;

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
            priceEstimate !== undefined ? defaultCurrency : undefined,
          taggedPeople: taggedIds,
          status,
          ...(image.kind === "set" && { imageStorageId: image.storageId }),
          ...(image.kind === "removed" && { imageStorageId: null }),
        },
      });
      router.back();
    } catch (err) {
      Alert.alert(t("common.couldNotSave"), describeMutationError(err, t));
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert(t("ideaForm.deleteConfirmTitle"), t("common.cantBeUndone"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await removeIdea({ id: ideaId });
            router.back();
          } catch (err) {
            Alert.alert(
              t("common.couldNotDelete"),
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
        title={t("ideaForm.editTitle")}
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
          <ScreenTitle>{t("ideaForm.editScreenTitle")}</ScreenTitle>

          <View style={styles.fields}>
            <View>
              <ImagePickerField
                label={t("capture.imageLabel")}
                previewUri={
                  image.kind === "set"
                    ? image.previewUri
                    : image.kind === "removed"
                      ? null
                      : idea.imageUrl
                }
                shape="square"
                uploading={uploading}
                onPick={onPickImage}
                onRemove={onRemoveImage}
              />
              {showFetchFromSource && (
                <Pressable
                  onPress={onFetchImageFromSource}
                  hitSlop={6}
                  style={styles.fetchFromSource}
                >
                  <Text style={styles.fetchFromSourceText}>
                    {t("imagePicker.fetchFromSource")}
                  </Text>
                </Pressable>
              )}
            </View>
            <TextField
              label={t("capture.ideaLabel")}
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
              autoCorrect
              returnKeyType="next"
            />

            <TextField
              label={t("capture.sourceLabel")}
              placeholder="https://…"
              value={sourceUrl}
              onChangeText={setSourceUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <TextField
              label={t("capture.priceLabel", { currency: defaultCurrency })}
              placeholder={t("common.optional")}
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
              <Label style={styles.statusLabel}>{t("ideaForm.status")}</Label>
              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    hitSlop={4}
                  >
                    <Pill tone={status === s ? "brass" : "default"}>
                      {t(STATUS_KEY[s])}
                    </Pill>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextField
              label={t("capture.descriptionLabel")}
              placeholder={t("common.optional")}
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
              {saving ? t("common.saving") : t("common.save")}
            </Btn>

            <Btn
              tone="danger"
              full
              onPress={onDelete}
              style={styles.deleteBtn}
            >
              {t("ideaForm.deleteButton")}
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
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fetchFromSource: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fetchFromSourceText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.brass,
  },
});
