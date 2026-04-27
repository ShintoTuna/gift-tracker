import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/theme/tokens";

import { Label } from "./Label";
import { Pill } from "./Pill";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Days available per month (1-indexed via MONTHS, 0 = January).
// February gets 29 to allow Feb 29; we don't track leap years
// because the year isn't stored anyway.
function daysInMonth(month: number): number {
  if (month === 1) return 29;
  if ([3, 5, 8, 10].includes(month)) return 30;
  return 31;
}

type Props = {
  label?: string;
  // null means "no date set" (TBD). When non-null, the Date carries
  // year=2000 sentinel + the picked month/day. Caller is expected to
  // re-normalize at save time anyway, so the year is purely a vehicle.
  value: Date | null;
  onChange: (next: Date | null) => void;
};

// Two iOS wheel pickers (month name + day number). No year selector
// at all — for capturing a person's birth date with month + day only.
// "+ Set a date" pill in the empty state mirrors the DatePicker
// atom; "Clear date" pill below the wheels resets to null.
export function MonthDayPicker({
  label = "Date",
  value,
  onChange,
}: Props) {
  const [month, setMonth] = useState(value?.getUTCMonth() ?? 0);
  const [day, setDay] = useState(value?.getUTCDate() ?? 1);

  // Sync local picker state when the parent passes a new value
  // (e.g., the edit screen initializes from a loaded row). Using
  // the timestamp keeps the dep stable across Date references that
  // represent the same moment.
  const valueTime = value?.getTime() ?? null;
  useEffect(() => {
    if (valueTime !== null) {
      const d = new Date(valueTime);
      setMonth(d.getUTCMonth());
      setDay(d.getUTCDate());
    }
  }, [valueTime]);

  const handleMonthChange = (m: number) => {
    setMonth(m);
    // Snap day back if the new month doesn't have it (e.g., 31 → 30
    // when switching from Jan to Feb).
    const maxDay = daysInMonth(m);
    const safeDay = day > maxDay ? maxDay : day;
    if (safeDay !== day) setDay(safeDay);
    if (value !== null) {
      onChange(new Date(Date.UTC(2000, m, safeDay)));
    }
  };

  const handleDayChange = (d: number) => {
    setDay(d);
    if (value !== null) {
      onChange(new Date(Date.UTC(2000, month, d)));
    }
  };

  const dayCount = daysInMonth(month);

  return (
    <View>
      <Label style={styles.headerLabel}>{label}</Label>
      {value === null ? (
        <Pressable
          onPress={() => onChange(new Date(Date.UTC(2000, month, day)))}
          hitSlop={6}
          style={styles.setRow}
        >
          <Pill tone="brass" dashed>
            + Set a date
          </Pill>
        </Pressable>
      ) : (
        <View>
          <View style={styles.row}>
            <Picker
              style={styles.monthPicker}
              itemStyle={styles.pickerItem}
              selectedValue={month}
              onValueChange={(v) => handleMonthChange(Number(v))}
            >
              {MONTHS.map((name, idx) => (
                <Picker.Item
                  key={idx}
                  label={name}
                  value={idx}
                  color={colors.text}
                />
              ))}
            </Picker>
            <Picker
              style={styles.dayPicker}
              itemStyle={styles.pickerItem}
              selectedValue={day}
              onValueChange={(v) => handleDayChange(Number(v))}
            >
              {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
                <Picker.Item
                  key={d}
                  label={String(d)}
                  value={d}
                  color={colors.text}
                />
              ))}
            </Picker>
          </View>
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
  headerLabel: {
    marginBottom: spacing.sm,
  },
  setRow: {
    alignSelf: "flex-start",
  },
  row: {
    flexDirection: "row",
  },
  monthPicker: {
    flex: 2,
  },
  dayPicker: {
    flex: 1,
  },
  pickerItem: {
    color: colors.text,
    fontSize: 18,
  },
  clearRow: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
});
