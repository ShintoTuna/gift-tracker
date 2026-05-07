// Re-generates every app icon and splash variant from the master logo PNG.
// Re-run with `node scripts/generate-icons.mjs` after replacing the master
// in `assets/source/logo.png`.
//
// Input (assets/source/logo.png): gold G + leaves on a transparent
// background. Source for every output below.
//
// Outputs (assets/images/):
//   - icon.png                       1024×1024  midnight-green bg, gold G  — iOS app icon, Android fallback
//   - splash-icon.png                1024×1024  transparent, gold G        — splash plugin, layered over #0F1A16
//   - android-icon-foreground.png    1024×1024  transparent, gold G inset  — Android adaptive icon foreground
//   - android-icon-background.png    1024×1024  solid #0F1A16              — Android adaptive icon background
//   - android-icon-monochrome.png    1024×1024  white silhouette           — Android 13+ themed icons
//   - favicon.png                    256×256    transparent, gold G        — web favicon
//
// Sharp is intentionally NOT in package.json — its native prebuild fails
// to install on EAS Build (no node-addon-api / node-gyp in the cloud
// build env), which would break every production build. Instead, we
// lazy-install via `npm install --no-save sharp` on first run, scoped
// to local node_modules only. Manifest stays clean.

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
const SOURCE = path.join(__dirname, "..", "assets", "source", "logo.png");
const OUT_DIR = path.join(__dirname, "..", "assets", "images");
mkdirSync(OUT_DIR, { recursive: true });

// Midnight Garden tokens — keep in sync with src/theme/tokens.ts.
const C = {
  bg: { r: 0x0f, g: 0x1a, b: 0x16, alpha: 1 },
};

const CANVAS = 1024;

// Composite the source logo onto a canvas at `logoFraction` of canvas width.
// `background` of `null` leaves the canvas transparent.
async function composite({ logoFraction, background = null, canvas = CANVAS }) {
  const logoSize = Math.round(canvas * logoFraction);
  const logo = await sharp(SOURCE)
    .ensureAlpha()
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png();
}

async function write(pipeline, outName) {
  const out = path.join(OUT_DIR, outName);
  await pipeline.toFile(out);
  console.log(`wrote ${out}`);
}

// 1. iOS app icon — gold G on midnight green, generous padding inside Apple's mask.
await write(
  await composite({ logoFraction: 0.72, background: C.bg }),
  "icon.png",
);

// 2. Splash icon — gold G, transparent background. Layered over #0F1A16 by the splash plugin.
await write(await composite({ logoFraction: 0.72 }), "splash-icon.png");

// 3. Android adaptive foreground — inset to ~66% so it survives round/squircle/square masks.
await write(
  await composite({ logoFraction: 0.66 }),
  "android-icon-foreground.png",
);

// 4. Android adaptive background — flat midnight green.
await write(
  sharp({
    create: { width: CANVAS, height: CANVAS, channels: 4, background: C.bg },
  }).png(),
  "android-icon-background.png",
);

// 5. Android themed monochrome — white silhouette derived from the source
//    alpha, then composed onto a 1024² transparent canvas.
{
  const silhouetteSize = Math.round(CANVAS * 0.66);
  const alpha = await sharp(SOURCE)
    .ensureAlpha()
    .resize(silhouetteSize, silhouetteSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extractChannel("alpha")
    .raw()
    .toBuffer();

  const white = await sharp({
    create: {
      width: silhouetteSize,
      height: silhouetteSize,
      channels: 3,
      background: "#FFFFFF",
    },
  })
    .joinChannel(alpha, {
      raw: { width: silhouetteSize, height: silhouetteSize, channels: 1 },
    })
    .png()
    .toBuffer();

  const base = sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
  await write(
    base.composite([{ input: white, gravity: "center" }]).png(),
    "android-icon-monochrome.png",
  );
}

// 6. Favicon — gold G on transparent at smaller canvas; reads on light & dark browser chrome.
await write(
  await composite({ logoFraction: 0.8, canvas: 256 }),
  "favicon.png",
);
