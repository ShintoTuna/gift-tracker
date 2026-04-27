// Re-generates the app icon and splash icon from a single SVG
// definition. Re-run with `node scripts/generate-icons.mjs` after
// editing the SVG below if the icon needs to evolve.
//
// The two outputs:
//   - assets/images/icon.png      — 1024×1024, brass background,
//                                   dark gift silhouette + cream
//                                   ribbons. Used as the iOS app
//                                   icon (and Android fallback).
//   - assets/images/splash-icon.png — 1024×1024, transparent
//                                   background, brass gift box
//                                   centered. Layered over the
//                                   midnight-green splash background
//                                   color set in app.json.
//
// Sharp renders the SVG at 1024×1024 directly; no rasterization
// loss. Iterate on shape proportions in the SVG strings, not on the
// PNG output.
//
// Sharp is intentionally NOT in package.json — its native prebuild
// fails to install on EAS Build (no node-addon-api / node-gyp in
// the cloud build env), which would break every production build.
// Instead, we lazy-install via `npm install --no-save sharp` on
// first run, scoped to local node_modules only. Manifest stays
// clean.

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdirSync } from "node:fs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.log(
    "sharp not installed. Adding it locally (without touching package.json)…",
  );
  execSync("npm install --no-save sharp", {
    stdio: "inherit",
    cwd: repoRoot,
  });
  sharp = (await import("sharp")).default;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "..", "assets", "images");
mkdirSync(ASSETS_DIR, { recursive: true });

// Midnight Garden tokens — keep in sync with src/theme/tokens.ts.
const C = {
  bg: "#0F1A16",
  brass: "#C8A45A",
  cream: "#E8E1CF",
};

// Reusable gift-box glyph centered in a 1024×1024 viewBox. Scales to
// roughly 60% of canvas width with generous padding so it reads at
// small home-screen sizes. Two cream ribbons cross the dark box; a
// chunky two-loop bow sits on top.
function giftGlyph({ boxFill, ribbonFill }) {
  return `
    <!-- Lid (slightly wider than body for that classic giftbox overhang) -->
    <rect x="184" y="424" width="656" height="92" fill="${boxFill}" rx="16"/>
    <!-- Body -->
    <rect x="216" y="516" width="592" height="332" fill="${boxFill}" rx="20"/>

    <!-- Cream cross ribbons over the dark box -->
    <rect x="488" y="424" width="48" height="424" fill="${ribbonFill}"/>
    <rect x="184" y="588" width="656" height="44" fill="${ribbonFill}"/>

    <!-- Bow on top: two loops + center knot -->
    <ellipse cx="404" cy="354" rx="100" ry="60" fill="${boxFill}"/>
    <ellipse cx="620" cy="354" rx="100" ry="60" fill="${boxFill}"/>
    <rect x="488" y="316" width="48" height="92" fill="${boxFill}" rx="6"/>
  `;
}

const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${C.brass}"/>
  ${giftGlyph({ boxFill: C.bg, ribbonFill: C.cream })}
</svg>
`;

const SPLASH_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${giftGlyph({ boxFill: C.brass, ribbonFill: C.cream })}
</svg>
`;

async function render(svg, outName) {
  const out = path.join(ASSETS_DIR, outName);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`wrote ${out}`);
}

await render(ICON_SVG, "icon.png");
await render(SPLASH_SVG, "splash-icon.png");
