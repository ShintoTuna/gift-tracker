import type { IconName, IconProps, IconWeight } from "./Icon";

export type { IconName, IconProps, IconWeight };

// Lucide-style SVG paths chosen as the closest visual match to each
// SF Symbol used on native. Stroked + rounded; filled variants set
// `fill={color}` instead of stroking.
const PATHS: Record<IconName, { d: string; filled?: boolean }> = {
  plus: { d: "M12 5v14M5 12h14" },
  "chevron.left": { d: "M15 18l-6-6 6-6" },
  xmark: { d: "M18 6L6 18M6 6l12 12" },
  "person.2": {
    d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  },
  "person.2.fill": {
    d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    filled: true,
  },
  calendar: {
    d: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  },
  gift: {
    d: "M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  },
  "gift.fill": {
    d: "M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
    filled: true,
  },
  gearshape: {
    d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.04a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.04a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  },
};

const STROKE_FOR_WEIGHT: Record<IconWeight, number> = {
  ultraLight: 1,
  thin: 1.25,
  light: 1.5,
  regular: 1.75,
  medium: 2,
  semibold: 2.25,
  bold: 2.5,
  heavy: 2.75,
  black: 3,
};

export function Icon({ name, color, size, weight }: IconProps) {
  const entry = PATHS[name];
  const strokeWidth = weight ? STROKE_FOR_WEIGHT[weight] : 1.75;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={entry.filled ? color : "none"}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {entry.d.split(/\s(?=M)/).map((d, i) => (
        <path key={i} d={d.trim()} />
      ))}
    </svg>
  );
}
