import DateTimePicker from "@react-native-community/datetimepicker";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/theme/tokens";

import { Label } from "./Label";
import { Pill } from "./Pill";

type Props = {
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
export function DatePicker({ label = "Date", value, onChange }: Props) {
  return (
    <View>
      <Label style={styles.label}>{label}</Label>
      {value === null ? (
        <Pressable
          onPress={() => onChange(new Date())}
          hitSlop={6}
          style={styles.setRow}
        >
          <Pill tone="brass" dashed>
            + Set a date
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
          >
            <Pill tone="default">Clear date</Pill>
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
