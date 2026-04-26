import { ConvexReactClient } from "convex/react";

// EXPO_PUBLIC_CONVEX_URL is written to .env.local by `npx convex dev`
// during the first-time setup. EXPO_PUBLIC_* vars are baked at bundle
// time, so if you start Metro before convex dev has written this
// var, you'll need to restart Metro.
export const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!,
  { unsavedChangesWarning: false },
);
