import { ConvexReactClient } from "convex/react";

// EXPO_PUBLIC_CONVEX_URL is written to .env.local by `npx convex dev`
// during the first-time setup. EXPO_PUBLIC_* vars are baked at bundle
// time, so if you start Metro before convex dev has written this
// var, you'll need to restart Metro. In OTA-published bundles the
// var comes from the EXPO_PUBLIC_CONVEX_URL repo secret read by
// `.github/workflows/eas-update.yml`.
//
// We previously trusted the `!` non-null assertion and passed the
// value straight into `new ConvexReactClient(...)`. When the GitHub
// Actions secret was missing, that became `new ConvexReactClient(undefined)`,
// which threw a generic "Invalid URL" at module evaluation — before
// any error boundary or Sentry could mount, leaving users with a
// black screen and no trace. The workflow now fails fast on a
// missing secret, but throw a *named* error here too so the same
// failure during local dev is recognisable instead of a stray URL
// parse error.
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "EXPO_PUBLIC_CONVEX_URL is not set. " +
      "Locally: run `npx convex dev` and restart Metro so the .env.local " +
      "value is baked into the bundle. In CI/OTA: set the " +
      "EXPO_PUBLIC_CONVEX_URL repo secret consumed by " +
      ".github/workflows/eas-update.yml.",
  );
}

export const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});
