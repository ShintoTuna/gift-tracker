// Builds App Store screenshots from raw iOS Simulator captures.
//
// Workflow:
//   1. In the iOS Simulator (iPhone 16 Pro Max), set a clean status
//      bar:
//        xcrun simctl status_bar booted override \
//          --time 9:41 --batteryState charged --batteryLevel 100 \
//          --cellularBars 4 --wifiBars 3
//   2. Sign in to the app with the seeded account, navigate to each
//      screen below, and ⌘S to save the screenshot.
//   3. Drop the five PNGs into `marketing/screenshots/raw/`,
//      renaming to:
//        1-people.png    (People tab — Sarah at top with claret accent)
//        2-person.png    (Sarah's profile)
//        3-calendar.png  (Calendar tab)
//        4-gifts.png     (Gifts tab)
//        5-gift.png      (single gift idea detail)
//   4. Run `node scripts/build-screenshots.mjs`. Output PNGs land
//      in `marketing/screenshots/built/` at 1290×2796 (App Store
//      6.9" iPhone size — Apple uses these for both 6.9" and 6.5"
//      device families).
//   5. Upload to App Store Connect.
//
// Headlines are set in the italic serif (Cormorant Garamond Bold
// Italic) that the app uses for screen titles like "Calendar" and
// "Gifts". The font is embedded as base64 inside the SVG so librsvg
// renders it without depending on system font installation.
//
// Edit the `SCREENS` array below to retune headlines without
// re-capturing screenshots.
//
// Sharp is intentionally NOT in package.json — same reasoning as
// `generate-icons.mjs` (its native prebuild fails on EAS Build).
// We lazy-install it locally on first run.

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { existsSync, mkdirSync, readFileSync } from "node:fs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

async function lazy(pkg) {
  try {
    return await import(pkg);
  } catch {
    console.log(`${pkg} not installed. Adding locally (no manifest changes)…`);
    execSync(`npm install --no-save ${pkg}`, {
      stdio: "inherit",
      cwd: repoRoot,
    });
    return await import(pkg);
  }
}

const sharp = (await lazy("sharp")).default;
// @napi-rs/canvas renders the italic serif headline. Tried sharp's
// own Pango integration and an opentype.js → SVG path approach first;
// neither honored the custom Cormorant Garamond font reliably (Pango
// fell back to a generic italic; librsvg silently truncated long
// path data). Canvas registers the font by family name and rasterizes
// the headline to a transparent PNG that we composite in below.
const canvasMod = await lazy("@napi-rs/canvas");
const { GlobalFonts, createCanvas } = canvasMod;

const RAW_DIR = path.join(repoRoot, "marketing", "screenshots", "raw");
const OUT_DIR = path.join(repoRoot, "marketing", "screenshots", "built");
mkdirSync(RAW_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// Three fonts registered into canvas:
//   - Manrope Bold        → main headline (white, sans, primary phrase)
//   - Cormorant Bold Itl. → headline accent word (brass, italic serif —
//                           same face the app uses for "Calendar"/"Gifts"
//                           titles)
//   - Manrope Medium      → eyebrow (all-caps, brass) + subhead (light)
const FONT_DIR = path.join(repoRoot, "node_modules", "@expo-google-fonts");
const HEADLINE_FAMILY = "Manrope Display";
const ACCENT_FAMILY = "Cormorant Display";
const SUPPORT_FAMILY = "Manrope Support";
GlobalFonts.registerFromPath(
  path.join(FONT_DIR, "manrope/700Bold/Manrope_700Bold.ttf"),
  HEADLINE_FAMILY,
);
GlobalFonts.registerFromPath(
  path.join(
    FONT_DIR,
    "cormorant-garamond/700Bold_Italic/CormorantGaramond_700Bold_Italic.ttf",
  ),
  ACCENT_FAMILY,
);
GlobalFonts.registerFromPath(
  path.join(FONT_DIR, "manrope/500Medium/Manrope_500Medium.ttf"),
  SUPPORT_FAMILY,
);

// Palette is derived from src/theme/tokens.ts but pushed for poster
// contrast — the canvas bg is intentionally darker and warmer than
// the in-app `bg` so the cool-midnight screenshot reads as a distinct
// object floating on the canvas.
const C = {
  bgInner: "#1A140E", // warm dark center (under the device)
  bgOuter: "#08060A", // near-black at corners (vignette)
  glow: "#C8A45A", // brass — used as a soft radial glow under device
  headline: "#FFFFFF", // primary headline — pure white for max contrast
  accent: "#C8A45A", // accent word in italic serif (the app's brass)
  eyebrow: "#C8A45A", // small all-caps eyebrow above the headline
  subhead: "rgba(255,255,255,0.72)", // soft white for support copy
  bezel: "#1E1B17", // warm dark grey, distinctly lighter than bgInner
  bezelEdge: "rgba(200, 164, 90, 0.22)", // brass-tinted device rim
  island: "#000000",
};

// App Store 6.5"/6.7" iPhone canvas — accepted dimensions per
// App Store Connect: 1242×2688, 1284×2778 (and landscape variants).
// 1284×2778 is closest to the iPhone 16 Pro Max simulator capture
// (1290×2796) so the screen area aspect drift is negligible.
const W = 1284;
const H = 2778;

// Device frame layout. The device is pushed down so the top ~22% of
// the canvas is owned by the eyebrow / headline / subhead block.
// Screen area aspect matches the raw screenshot (1290/2796 = 0.4614)
// so the captured image fills it edge-to-edge with no letterbox.
const SCREEN_W = 938;
const SCREEN_H = Math.round((SCREEN_W * H) / W); // 2034
const BEZEL = 18;
const BEZEL_RADIUS = 114;
const SCREEN_RADIUS = BEZEL_RADIUS - BEZEL;
const DEVICE_W = SCREEN_W + 2 * BEZEL; // 974
const DEVICE_H = SCREEN_H + 2 * BEZEL; // 2070
const DEVICE_X = Math.round((W - DEVICE_W) / 2); // 158
const DEVICE_Y = 600;
const SCREEN_X = DEVICE_X + BEZEL;
const SCREEN_Y = DEVICE_Y + BEZEL;

// Dynamic island, drawn on top of the screenshot.
const ISLAND_W = 220;
const ISLAND_H = 60;
const ISLAND_X = Math.round((W - ISLAND_W) / 2);
const ISLAND_Y = SCREEN_Y + 24;

// Text block (eyebrow + mixed-font headline) lives in the area above
// the device. Eyebrow is small all-caps Manrope Medium; headline is
// large Manrope Bold + an italic-serif accent phrase in brass.
const EYEBROW_FONT_SIZE = 36;
const EYEBROW_TRACKING = 8; // extra px between glyphs
const HEADLINE_FONT_SIZE = 130;

// Each headline is split into a `primary` (sans bold white) and
// `accent` (italic serif brass) phrase. The accent renders inline,
// emphasizing the "punch" word at the end of the line. Subhead is
// short support copy that wraps to 1–2 lines.
const SCREENS = [
  {
    id: "people",
    file: "1-people.png",
    eyebrow: "EVERYONE WHO MATTERS",
    primary: "Never miss",
    accent: "a moment.",
  },
  {
    id: "person",
    file: "2-person.png",
    eyebrow: "A PAGE FOR EACH PERSON",
    primary: "Know them,",
    accent: "deeply.",
  },
  {
    id: "calendar",
    file: "3-calendar.png",
    eyebrow: "THE YEAR AT A GLANCE",
    primary: "Always one",
    accent: "step ahead.",
  },
  {
    id: "gifts",
    file: "4-gifts.png",
    eyebrow: "YOUR GIFT BACKLOG",
    primary: "Every idea,",
    accent: "kept close.",
  },
  {
    id: "gift",
    file: "5-gift.png",
    eyebrow: "ONE GIFT, ONE STORY",
    primary: "The whole",
    accent: "story.",
  },
];

// Eyebrow ("A PAGE FOR EACH PERSON") at baseline `cy`. Manrope
// Medium, brass, all-caps with extra letter-spacing measured per
// glyph (canvas2d's `letterSpacing` isn't reliable across versions).
function drawEyebrow(ctx, text, cy) {
  ctx.font = `500 ${EYEBROW_FONT_SIZE}px "${SUPPORT_FAMILY}"`;
  ctx.fillStyle = C.eyebrow;
  ctx.textBaseline = "middle";
  const chars = [...text.toUpperCase()];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total =
    widths.reduce((a, b) => a + b, 0) + EYEBROW_TRACKING * (chars.length - 1);
  let cursor = (W - total) / 2;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cursor, cy);
    cursor += widths[i] + EYEBROW_TRACKING;
  });
}

// Mixed-font headline on one centered line. Primary in Manrope Bold
// white, accent in Cormorant Bold Italic brass — the italic word
// punches at the end of the phrase.
function drawHeadline(ctx, primary, accent, cy) {
  const SPACE = " ";
  const primaryFont = `700 ${HEADLINE_FONT_SIZE}px "${HEADLINE_FAMILY}"`;
  const accentFont = `italic 700 ${HEADLINE_FONT_SIZE}px "${ACCENT_FAMILY}"`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  ctx.font = primaryFont;
  const wPrimary = ctx.measureText(primary).width;
  const wSpace = ctx.measureText(SPACE).width;
  ctx.font = accentFont;
  const wAccent = ctx.measureText(accent).width;
  const total = wPrimary + wSpace + wAccent;

  let cursor = (W - total) / 2;
  ctx.font = primaryFont;
  ctx.fillStyle = C.headline;
  ctx.fillText(primary, cursor, cy);
  cursor += wPrimary + wSpace;
  ctx.font = accentFont;
  ctx.fillStyle = C.accent;
  ctx.fillText(accent, cursor, cy);
}

// Render the eyebrow + headline block as a transparent PNG that
// gets composited above the device.
function renderTextBuffer(spec) {
  const canvas = createCanvas(W, DEVICE_Y);
  const ctx = canvas.getContext("2d");
  drawEyebrow(ctx, spec.eyebrow, 180);
  drawHeadline(ctx, spec.primary, spec.accent, 380);
  return canvas.encode("png");
}

// Background SVG: warm radial-vignette bg + soft brass glow halo
// behind the device + device bezel + screen image + dynamic island.
// The headline is composited on top afterward via sharp.
//
// Two radial gradients do the heavy lifting:
//   - `bg`     centered on the device, fades from warm dark to near-
//              black at the corners (a vignette that draws the eye
//              inward)
//   - `halo`   a soft brass glow under and around the device, low
//              opacity, gives the device "presence" and hooks into
//              the brand accent without drowning the screenshot
const DEVICE_CX = W / 2;
const DEVICE_CY = DEVICE_Y + DEVICE_H / 2;

function buildBackgroundSvg(screenshotDataUri) {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <radialGradient id="bg" cx="${DEVICE_CX}" cy="${DEVICE_CY}" r="${H * 0.7}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${C.bgInner}"/>
      <stop offset="100%" stop-color="${C.bgOuter}"/>
    </radialGradient>
    <radialGradient id="halo" cx="${W / 2}" cy="${DEVICE_Y - 80}" r="${W * 0.85}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${C.glow}" stop-opacity="0.30"/>
      <stop offset="35%" stop-color="${C.glow}" stop-opacity="0.14"/>
      <stop offset="70%" stop-color="${C.glow}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${C.glow}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="screen">
      <rect x="${SCREEN_X}" y="${SCREEN_Y}" width="${SCREEN_W}" height="${SCREEN_H}" rx="${SCREEN_RADIUS}"/>
    </clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
  <rect x="${DEVICE_X}" y="${DEVICE_Y}" width="${DEVICE_W}" height="${DEVICE_H}" rx="${BEZEL_RADIUS}" fill="${C.bezel}" stroke="${C.bezelEdge}" stroke-width="3"/>
  <image x="${SCREEN_X}" y="${SCREEN_Y}" width="${SCREEN_W}" height="${SCREEN_H}" clip-path="url(#screen)" preserveAspectRatio="xMidYMid slice" xlink:href="${screenshotDataUri}"/>
  <rect x="${ISLAND_X}" y="${ISLAND_Y}" width="${ISLAND_W}" height="${ISLAND_H}" rx="${ISLAND_H / 2}" fill="${C.island}"/>
</svg>`;
}

async function buildOne(spec) {
  const inPath = path.join(RAW_DIR, spec.file);
  const outPath = path.join(OUT_DIR, spec.file);
  if (!existsSync(inPath)) {
    console.warn(
      `  skip ${spec.id}: no raw at marketing/screenshots/raw/${spec.file}`,
    );
    return;
  }
  const raw = readFileSync(inPath);
  const dataUri = `data:image/png;base64,${raw.toString("base64")}`;
  const bgSvg = buildBackgroundSvg(dataUri);
  const textBuf = await renderTextBuffer(spec);
  await sharp(Buffer.from(bgSvg))
    .composite([{ input: textBuf, top: 0, left: 0 }])
    .png()
    .toFile(outPath);
  console.log(`  ✓ marketing/screenshots/built/${spec.file}`);
}

console.log("Building App Store screenshots…");
for (const spec of SCREENS) {
  await buildOne(spec);
}
console.log("Done.");
