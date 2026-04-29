// Curated dark-earth palette for placeholder idea thumbs. Lifted from
// the Midnight Garden v3 design (see /design/v3/screens.jsx — the
// `<IC thumb="#..."/>` calls). All entries sit in the same muted
// 0x30–0x5a range so any random seed lands on something that still
// reads as the brand.
const THUMB_PALETTE = [
  "#3a4a4a", // teal-grey
  "#5a4a3a", // warm brown
  "#3a4a3a", // sage
  "#4a3a4a", // mauve
  "#3a3a4a", // slate
  "#4a3a3a", // rust
  "#4a4a3a", // ochre
  "#3a4a52", // muted teal
] as const;

// djb2 — small, deterministic, no allocations. We don't need a
// cryptographic hash; we just need stable-per-seed bucketing into
// the palette.
function hash(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 33) ^ seed.charCodeAt(i);
  }
  return h >>> 0;
}

// Deterministic color for a placeholder thumb. Same seed → same
// color forever, so a given idea's tile keeps its hue across
// renders and reloads without touching the database.
export function thumbColorForSeed(seed: string | undefined): string {
  if (!seed || seed.length === 0) return THUMB_PALETTE[0];
  return THUMB_PALETTE[hash(seed) % THUMB_PALETTE.length];
}
