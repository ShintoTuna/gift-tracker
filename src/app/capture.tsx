import { useAction, useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Btn,
  ImagePickerField,
  KeyboardForm,
  NavBar,
  PeoplePicker,
  ScreenTitle,
  TextField,
} from "@/components";
import { notify } from "@/lib/alerts";
import { pickCompressUpload, type PickSource } from "@/lib/imageUpload";
import { useDefaultCurrency } from "@/lib/settings";
import { useLimitErrorSheet } from "@/lib/useLimitErrorSheet";
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
  const { personId, forSelf: forSelfParam } = useLocalSearchParams<{
    personId?: string;
    forSelf?: string;
  }>();
  // The Wish List tab launches capture with `?forSelf=1`. The flag
  // travels through Save and lands the new row on the wish list
  // instead of (or alongside) the gift backlog. The form itself
  // shows no extra control — keeping the gift capture path single-
  // purpose was an explicit design call.
  const forSelf = forSelfParam === "1";
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
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      // tagged idea shows up under "Considered". From the Wish List
      // FAB, land back on the wish list. Otherwise land on the gift
      // backlog. `replace` so the back stack doesn't preserve the
      // (now-empty) form.
      if (personId) {
        router.back();
      } else if (forSelf) {
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
        title={forSelf ? t("wishlist.captureTitle") : t("capture.title")}
        leading="close"
        onLeadingPress={() => router.back()}
      />
      <KeyboardForm>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle
            sub={
              forSelf ? t("wishlist.captureSubtitle") : t("capture.subtitle")
            }
          >
            {forSelf
              ? t("wishlist.captureScreenTitle")
              : t("capture.screenTitle")}
          </ScreenTitle>

          <View style={styles.fields}>
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
});
