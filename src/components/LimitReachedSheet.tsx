import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import type { LimitReachedData } from "@/lib/convexErrors";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

type Props = {
  data: LimitReachedData | null;
  onDismiss: () => void;
};

// Friendly sheet shown instead of a generic Alert when a create
// mutation throws `LimitReached`. The disabled "Upgrade (coming soon)"
// CTA makes the tier architecture visible — placeholder until the
// paywall ships post-launch (see docs/public-release-plan.md §3).
export function LimitReachedSheet({ data, onDismiss }: Props) {
  const { t } = useTranslation();
  const visible = data !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.title}>{t("limits.sheetTitle")}</Text>
          {data ? (
            <>
              <Text style={styles.body}>
                {t(`limits.${data.resource}`, { count: data.limit })}
              </Text>
              <Text style={styles.usage}>
                {t("limits.sheetUsage", {
                  current: data.current,
                  limit: data.limit,
                })}
              </Text>
            </>
          ) : null}
          <View style={styles.actions}>
            <Btn tone="default" full disabled>
              {t("limits.sheetUpgrade")}
            </Btn>
            <Btn tone="primary" full onPress={onDismiss}>
              {t("limits.sheetDismiss")}
            </Btn>
          </View>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text2,
    lineHeight: 21,
  },
  usage: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
