import { useMutation } from "convex/react";
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
  ImagePickerField,
  NavBar,
  ScreenTitle,
  TextField,
} from "@/components";
import { pickCompressUpload, type PickSource } from "@/lib/imageUpload";
import { useLimitErrorSheet } from "@/lib/useLimitErrorSheet";
import { colors, spacing } from "@/theme/tokens";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Modal-presented form. NavBar X dismisses; primary brass Save runs
// the people.create mutation and pops back. List updates reactively
// via Convex subscription — no manual refresh needed.
export default function NewPersonScreen() {
  const { t } = useTranslation();
  const createPerson = useMutation(api.people.create);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const { handleError, sheet: limitSheet } = useLimitErrorSheet();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [relationship, setRelationship] = useState("");
  const [interestsText, setInterestsText] = useState("");
  const [photoStorageId, setPhotoStorageId] = useState<Id<"_storage"> | null>(
    null,
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving && !uploading;

  const onPickPhoto = async (source: PickSource) => {
    if (uploading) return;
    setUploading(true);
    try {
      const result = await pickCompressUpload({
        generateUploadUrl: () => generateUploadUrl({}),
        source,
        square: true,
      });
      if (result) {
        setPhotoStorageId(result.storageId);
        setPhotoPreview(result.previewUri);
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

  const onRemovePhoto = () => {
    setPhotoStorageId(null);
    setPhotoPreview(null);
  };

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
        photoStorageId: photoStorageId ?? undefined,
        relationship: relationship.trim() || undefined,
        interests,
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
        title={t("personForm.newTitle")}
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
          <ScreenTitle sub={t("personForm.newSubtitle")}>
            {t("personForm.newScreenTitle")}
          </ScreenTitle>

          <View style={styles.fields}>
            <ImagePickerField
              label={t("personForm.photo")}
              previewUri={photoPreview}
              shape="circle"
              uploading={uploading}
              onPick={onPickPhoto}
              onRemove={photoPreview ? onRemovePhoto : undefined}
            />
            <TextField
              label={t("personForm.name")}
              placeholder={t("common.required")}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
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
            <TextField
              label={t("personForm.interests")}
              hint={t("personForm.interestsHint")}
              placeholder={t("personForm.interestsPlaceholder")}
              value={interestsText}
              onChangeText={setInterestsText}
              autoCapitalize="none"
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
  saveBtn: {
    marginTop: spacing.md,
  },
});
