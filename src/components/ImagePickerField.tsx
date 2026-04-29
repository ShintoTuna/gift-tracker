import { Image } from "expo-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { PickSource } from "@/lib/imageUpload";
import { colors, fonts, spacing } from "@/theme/tokens";

import { ImageSourceSheet } from "./ImageSourceSheet";
import { Label } from "./Label";

type Props = {
  label: string;
  // Local file URI or remote URL — both are passed straight to
  // expo-image, which handles each. Null/undefined renders the
  // placeholder slot.
  previewUri?: string | null;
  // "circle" (avatars) vs "square" (idea thumbnails). Same atom in
  // two flavors so the form UI doesn't need a parallel component.
  shape?: "circle" | "square";
  uploading?: boolean;
  onPick: (source: PickSource) => void;
  // Render the Remove affordance only when supplied AND a preview is
  // present. New-item forms don't pass this; edit forms do.
  onRemove?: () => void;
};

const PREVIEW_SIZE = 96;

// Single-purpose form field for picking + previewing an image. The
// caller owns the upload pipeline (see src/lib/imageUpload.ts) and
// the resulting storage id; this component only renders the slot
// and the change/remove affordances.
export function ImagePickerField({
  label,
  previewUri,
  shape = "circle",
  uploading,
  onPick,
  onRemove,
}: Props) {
  const { t } = useTranslation();
  const [androidSheetOpen, setAndroidSheetOpen] = useState(false);
  const radius = shape === "circle" ? PREVIEW_SIZE / 2 : 14;
  const hasPreview = !!previewUri;

  const openChooser = () => {
    if (uploading) return;
    if (Platform.OS === "ios") {
      const options = [
        t("imagePicker.takePhoto"),
        t("imagePicker.chooseFromLibrary"),
        t("common.cancel"),
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
        },
        (idx) => {
          if (idx === 0) onPick("camera");
          else if (idx === 1) onPick("library");
        },
      );
    } else {
      setAndroidSheetOpen(true);
    }
  };

  const handleAndroidSelect = (source: PickSource) => {
    setAndroidSheetOpen(false);
    onPick(source);
  };

  return (
    <View>
      <Label style={styles.label}>{label}</Label>
      <View style={styles.row}>
        <Pressable
          onPress={openChooser}
          accessibilityLabel={
            hasPreview
              ? t("imagePicker.changeA11y")
              : t("imagePicker.addA11y")
          }
          style={[
            styles.preview,
            { width: PREVIEW_SIZE, height: PREVIEW_SIZE, borderRadius: radius },
          ]}
        >
          {hasPreview ? (
            <Image
              source={{ uri: previewUri }}
              style={[
                styles.previewImage,
                { borderRadius: radius - 1 },
              ]}
              contentFit="cover"
              transition={120}
            />
          ) : (
            <Text style={styles.placeholder}>+</Text>
          )}
          {uploading && (
            <View style={[styles.overlay, { borderRadius: radius }]}>
              <ActivityIndicator size="small" color={colors.brass} />
            </View>
          )}
        </Pressable>
        <View style={styles.actions}>
          <Pressable onPress={openChooser} hitSlop={6}>
            <Text style={styles.action}>
              {hasPreview
                ? t("imagePicker.change")
                : t("imagePicker.add")}
            </Text>
          </Pressable>
          {onRemove && hasPreview && (
            <Pressable
              onPress={uploading ? undefined : onRemove}
              hitSlop={6}
            >
              <Text style={[styles.action, styles.actionRemove]}>
                {t("imagePicker.remove")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      {Platform.OS !== "ios" && (
        <ImageSourceSheet
          visible={androidSheetOpen}
          onSelect={handleAndroidSelect}
          onCancel={() => setAndroidSheetOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  preview: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.text3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,26,22,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    gap: spacing.sm,
  },
  action: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.brass,
  },
  actionRemove: {
    color: colors.claret,
  },
});
