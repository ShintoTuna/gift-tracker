// Midnight Garden v1.0 — see /design/v3/system-runtime.jsx and
// /design/Palette Directions v2.html.
//
// Brass rule: brass = "the next thing to do or look at." Use it for
// primary CTAs and one-off accents only. Never decoration. Cap at two
// brass elements per screen.

export const colors = {
  bg: "#0F1A16",
  surface: "#16241E",
  surface2: "#1C2D26",
  border: "#213830",
  border2: "#2A4338",
  text: "#E8E1CF",
  text2: "#A8B5A8",
  text3: "#8A9A8F",
  brass: "#C8A45A",
  brassDim: "#A08735",
  claret: "#A04545",
  fern: "#5A8A6A",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 14,
  lg: 16,
  xl: 22,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 14,
  pill: 999,
} as const;

// Placeholder. Real Google Fonts (DM Serif Display, Work Sans,
// IBM Plex Mono) get wired in the design-system step via expo-font.
export const fontFamilies = {
  display: "serif",
  body: "sans-serif",
  mono: "monospace",
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
