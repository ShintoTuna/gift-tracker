import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/theme/tokens";

import { Label } from "./Label";
import { Pill } from "./Pill";

type Props = {
  // When omitted, falls back to t("datePicker.defaultLabel"). Pass
  // an explicit label for screens that want different header copy.
  label?: string;
  // null means "no date set" (TBD). The form treats null as
  // `date: undefined` at save time.
  value: Date | null;
  onChange: (next: Date | null) => void;
};

// Optional date input. Default state shows "+ Set a date" pill;
// once a date is set, the iOS inline calendar is shown with a
// "Clear date" affordance underneath. Used by the occasion form
// and reusable for any future optional-date input.
export function DatePicker({ label, value, onChange }: Props) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("datePicker.defaultLabel");
  return (
    <View>
      <Label style={styles.label}>{resolvedLabel}</Label>
      {value === null ? (
        <Pressable
          onPress={() => onChange(new Date())}
          hitSlop={6}
          style={styles.setRow}
          accessibilityRole="button"
          accessibilityLabel={t("datePicker.setDate")}
        >
          <Pill tone="brass" dashed>
            {t("datePicker.setDate")}
          </Pill>
        </Pressable>
      ) : (
        <View>
          <DateTimePicker
            value={value}
            mode="date"
            display="inline"
            themeVariant="dark"
            accentColor={colors.brass}
            onChange={(_, selected) => {
              if (selected) onChange(selected);
            }}
          />
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={6}
            style={styles.clearRow}
            accessibilityRole="button"
            accessibilityLabel={t("datePicker.clearDate")}
          >
            <Pill tone="default">{t("datePicker.clearDate")}</Pill>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  setRow: {
    alignSelf: "flex-start",
  },
  clearRow: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
});
