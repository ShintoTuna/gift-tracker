import { useAction, useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  Btn,
  ImagePickerField,
  KeyboardForm,
  Label,
  NavBar,
  PeoplePicker,
  Pill,
  ScreenTitle,
  TextField,
} from "@/components";
import { notify } from "@/lib/alerts";
import { pickCompressUpload, type PickSource } from "@/lib/imageUpload";
import { useDefaultCurrency } from "@/lib/settings";
import { useLimitErrorSheet } from "@/lib/useLimitErrorSheet";
import { useSourceTitleSuggestion } from "@/lib/useSourceTitleSuggestion";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Quick Capture — the headline PRD feature. Sub-10s flow:
// title → save. Person tagging is optional (capture now, tag later
// in Backlog). Status defaults to "active" server-side.
//
// The Save button lives at the end of the ScrollView (not in a fixed
// footer) so the iOS keyboard accessory bar never collides with it.
export default function CaptureScreen() {
  const { t } = useTranslation();
  // Some entry points (the FAB / Sidebar CTA / empty-state on the
  // Wish List tab) pre-flip the "Also for me" toggle as a courtesy —
  // the form is otherwise identical regardless of where capture was
  // opened from.
  const { personId, forSelf: forSelfParam } = useLocalSearchParams<{
    personId?: string;
    forSelf?: string;
  }>();
  const people = useQuery(api.people.list);
  const createIdea = useMutation(api.giftIdeas.create);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const fetchImageFromUrl = useAction(api.imageFromUrl.fetchFromUrl);
  const defaultCurrency = useDefaultCurrency();
  const { handleError, sheet: limitSheet } = useLimitErrorSheet();

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [priceText, setPriceText] = useState("");
  const [description, setDescription] = useState("");
  // When opened from a profile screen, preselect that person. The
  // picker stays editable so the user can untag or add others.
  const [taggedIds, setTaggedIds] = useState<Id<"people">[]>(() =>
    personId ? [personId as Id<"people">] : [],
  );
  const [imageStorageId, setImageStorageId] = useState<Id<"_storage"> | null>(
    null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [forSelf, setForSelf] = useState(forSelfParam === "1");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const titleSuggestion = useSourceTitleSuggestion(sourceUrl);

  const canSave = title.trim().length > 0 && !saving && !uploading;

  const onPickImage = async (source: PickSource) => {
    if (uploading) return;
    setUploading(true);
    try {
      const result = await pickCompressUpload({
        generateUploadUrl: () => generateUploadUrl({}),
        source,
      });
      if (result) {
        setImageStorageId(result.storageId);
        setImagePreview(result.previewUri);
      }
    } catch (err) {
      notify(
        t("imagePicker.uploadFailed"),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setUploading(false);
    }
  };

  const onRemoveImage = () => {
    setImageStorageId(null);
    setImagePreview(null);
  };

  const onFetchImageFromSource = async () => {
    const url = sourceUrl.trim();
    if (!url || uploading) return;
    setUploading(true);
    try {
      const result = await fetchImageFromUrl({ url });
      setImageStorageId(result.storageId);
      setImagePreview(result.previewUrl ?? null);
    } catch (err) {
      // Surface a friendly hint instead of the raw Convex error —
      // many retailers block scrapers outright (Amazon, Cloudflare-
      // fronted shops) and "Source returned 403" means nothing to
      // the user. Still log the technical reason for debugging.
      console.warn("fetchImageFromUrl failed", err);
      notify(
        t("imagePicker.fetchFromSourceFailed"),
        t("imagePicker.fetchFromSourceHint"),
      );
    } finally {
      setUploading(false);
    }
  };

  const showFetchFromSource =
    sourceUrl.trim().length > 0 && !imagePreview && !uploading;

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
      await createIdea({
        title: title.trim(),
        description: description.trim() || undefined,
        imageStorageId: imageStorageId ?? undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        priceEstimate,
        // Currency only attaches when there's actually a price; an
        // unlabelled currency on a missing amount is noise.
        currency:
          priceEstimate !== undefined ? defaultCurrency : undefined,
        taggedPeople: taggedIds,
        forSelf: forSelf ? true : undefined,
      });
      // From a profile (personId param), return there so the freshly
      // tagged idea shows up under "Considered". A wish-only row
      // (forSelf with no tags) is invisible on the Gifts tab — land
      // on Wish List so the user sees what they just saved.
      // Otherwise land on the gift backlog. `replace` so the back
      // stack doesn't preserve the (now-empty) form.
      if (personId) {
        router.back();
      } else if (forSelf && taggedIds.length === 0) {
        router.replace("/(tabs)/wishlist");
      } else {
        router.replace("/(tabs)/backlog");
      }
    } catch (err) {
      handleError(err, t("capture.couldNotSave"));
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <NavBar
        title={t("capture.title")}
        leading="close"
        onLeadingPress={() => router.back()}
      />
      <KeyboardForm>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle sub={t("capture.subtitle")}>
            {t("capture.screenTitle")}
          </ScreenTitle>

          <View style={styles.fields}>
            <View>
              <TextField
                label={t("capture.ideaLabel")}
                placeholder={t("capture.ideaPlaceholder")}
                value={title}
                onChangeText={setTitle}
                autoFocus
                autoCapitalize="sentences"
                autoCorrect
                returnKeyType="next"
              />
              {titleSuggestion.suggestion && (
                <Pressable
                  onPress={() => {
                    setTitle(titleSuggestion.suggestion ?? "");
                    titleSuggestion.dismiss();
                  }}
                  hitSlop={6}
                  style={styles.titleSuggestion}
                  accessibilityRole="button"
                  accessibilityLabel={t("capture.titleSuggestionA11y", {
                    title: titleSuggestion.suggestion,
                  })}
                >
                  <Pill tone="brass">{titleSuggestion.suggestion}</Pill>
                </Pressable>
              )}
            </View>

            <View>
              <ImagePickerField
                label={t("capture.imageLabel")}
                previewUri={imagePreview}
                shape="square"
                uploading={uploading}
                onPick={onPickImage}
                onRemove={imagePreview ? onRemoveImage : undefined}
              />
              {showFetchFromSource && (
                <Pressable
                  onPress={onFetchImageFromSource}
                  hitSlop={6}
                  style={styles.fetchFromSource}
                  accessibilityRole="button"
                  accessibilityLabel={t("imagePicker.fetchFromSource")}
                >
                  <Text style={styles.fetchFromSourceText}>
                    {t("imagePicker.fetchFromSource")}
                  </Text>
                </Pressable>
              )}
            </View>

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

            <Pressable
              onPress={() => setForSelf((v) => !v)}
              hitSlop={6}
              accessibilityRole="switch"
              accessibilityState={{ checked: forSelf }}
              accessibilityLabel={t("ideaForm.forSelfLabel")}
              style={styles.forSelfRow}
            >
              <View style={styles.forSelfTextWrap}>
                <Label>{t("ideaForm.forSelfLabel")}</Label>
                <Text style={styles.forSelfHint}>
                  {t("ideaForm.forSelfHint")}
                </Text>
              </View>
              {/* pointerEvents: row's Pressable owns the tap so the
                  whole row is a hit target; Switch is a visual
                  indicator only. */}
              <View pointerEvents="none">
                <Switch
                  value={forSelf}
                  trackColor={{ false: colors.border, true: colors.brass }}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </Pressable>

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
              {saving ? t("common.saving") : t("capture.saveIdea")}
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
  descriptionInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  saveBtn: {
    marginTop: spacing.md,
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
  titleSuggestion: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  forSelfRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  forSelfTextWrap: {
    flexShrink: 1,
    gap: spacing.xs,
  },
  forSelfHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text3,
    lineHeight: 16,
  },
});
