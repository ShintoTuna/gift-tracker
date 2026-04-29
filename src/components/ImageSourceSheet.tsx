import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";

import type { PickSource } from "@/lib/imageUpload";

type Props = {
  visible: boolean;
  onSelect: (source: PickSource) => void;
  onCancel: () => void;
};

// Android counterpart to ActionSheetIOS for the camera/library
// chooser. Keeps the brass-on-surface look so the chooser matches
// the rest of the app instead of the stock Material dialog.
export function ImageSourceSheet({ visible, onSelect, onCancel }: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Pressable
            style={styles.option}
            onPress={() => onSelect("camera")}
            accessibilityRole="button"
          >
            <Text style={styles.optionText}>{t("imagePicker.takePhoto")}</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.option}
            onPress={() => onSelect("library")}
            accessibilityRole="button"
          >
            <Text style={styles.optionText}>
              {t("imagePicker.chooseFromLibrary")}
            </Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.option}
            onPress={onCancel}
            accessibilityRole="button"
          >
            <Text style={[styles.optionText, styles.cancelText]}>
              {t("common.cancel")}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,26,22,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  option: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  optionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.brass,
  },
  cancelText: {
    color: colors.text2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
