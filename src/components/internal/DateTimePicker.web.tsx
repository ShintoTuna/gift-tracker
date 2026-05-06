import { StyleSheet, View } from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";

// Subset of `@react-native-community/datetimepicker`'s prop surface
// the app actually uses. Web maps to native HTML date/time inputs.
type Props = {
  value: Date;
  mode?: "date" | "time";
  // Native-only display modes; ignored on web.
  display?: "default" | "inline" | "spinner" | "compact";
  themeVariant?: "light" | "dark";
  accentColor?: string;
  disabled?: boolean;
  onChange?: (event: { type: string }, date?: Date) => void;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toDateValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeValue(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DateTimePicker({
  value,
  mode = "date",
  disabled,
  onChange,
}: Props) {
  const stringValue =
    mode === "time" ? toTimeValue(value) : toDateValue(value);

  return (
    <View style={styles.wrap}>
      <input
        type={mode === "time" ? "time" : "date"}
        value={stringValue}
        disabled={disabled}
        onChange={(e: { target: { value: string } }) => {
          const raw = e.target.value;
          if (!raw) {
            onChange?.({ type: "dismissed" }, undefined);
            return;
          }
          const next = new Date(value);
          if (mode === "time") {
            const [h, m] = raw.split(":").map((p) => Number.parseInt(p, 10));
            next.setHours(h, m, 0, 0);
          } else {
            const [y, mo, d] = raw.split("-").map((p) => Number.parseInt(p, 10));
            next.setFullYear(y, mo - 1, d);
            next.setHours(0, 0, 0, 0);
          }
          onChange?.({ type: "set" }, next);
        }}
        style={inputStyle}
      />
    </View>
  );
}

// Inline style object — react-native-web's StyleSheet doesn't apply
// to raw DOM inputs, so we hand react-dom a plain CSS object.
const inputStyle = {
  backgroundColor: colors.surface,
  color: colors.text,
  borderColor: colors.border,
  borderWidth: 1,
  borderStyle: "solid" as const,
  borderRadius: radii.md,
  padding: `${spacing.sm}px ${spacing.md}px`,
  fontFamily: fonts.body,
  fontSize: 15,
  colorScheme: "dark" as const,
  accentColor: colors.brass,
  outline: "none",
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
  },
});
