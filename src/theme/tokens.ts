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

// Subtle tints used for Pill / chip backgrounds.
export const tints = {
  brassFill: "rgba(200, 164, 90, 0.14)",
  brassEdge: "rgba(200, 164, 90, 0.4)",
  claretFill: "rgba(160, 69, 69, 0.14)",
  claretEdge: "rgba(160, 69, 69, 0.35)",
  fernFill: "rgba(90, 138, 106, 0.14)",
  fernEdge: "rgba(90, 138, 106, 0.3)",
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

// Each weight is a separately registered font in expo-font, so the
// fontFamily string is the unique key (RN ignores fontWeight unless
// the weight is loaded under a name). Components reference these
// instead of asking for { fontFamily, fontWeight } pairs.
export const fonts = {
  serif: "CormorantGaramond_500Medium_Italic",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemiBold: "Manrope_600SemiBold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Fonts = typeof fonts;
