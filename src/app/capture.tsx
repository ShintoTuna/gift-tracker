import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  Btn,
  NavBar,
  PeoplePicker,
  ScreenTitle,
  TextField,
} from "@/components";
import { describeMutationError } from "@/lib/convexErrors";
import { useDefaultCurrency } from "@/lib/settings";
import { colors, spacing } from "@/theme/tokens";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Quick Capture — the headline PRD feature. Sub-10s flow:
// title → save. Person tagging is optional (capture now, tag later
// in Backlog). Status defaults to "idea" server-side.
//
// The Save button lives at the end of the ScrollView (not in a fixed
// footer) so the iOS keyboard accessory bar never collides with it.
export default function CaptureScreen() {
  const { t } = useTranslation();
  const people = useQuery(api.people.list);
  const createIdea = useMutation(api.giftIdeas.create);
  const defaultCurrency = useDefaultCurrency();

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [priceText, setPriceText] = useState("");
  const [description, setDescription] = useState("");
  const [taggedIds, setTaggedIds] = useState<Id<"people">[]>([]);
  const [saving, setSaving] = useState(false);

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
      await createIdea({
        title: title.trim(),
        description: description.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        priceEstimate,
        // Currency only attaches when there's actually a price; an
        // unlabelled currency on a missing amount is noise.
        currency:
          priceEstimate !== undefined ? defaultCurrency : undefined,
        taggedPeople: taggedIds,
      });
      router.back();
    } catch (err) {
      Alert.alert(t("capture.couldNotSave"), describeMutationError(err, t));
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle sub={t("capture.subtitle")}>
            {t("capture.screenTitle")}
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
  descriptionInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  saveBtn: {
    marginTop: spacing.md,
  },
});
