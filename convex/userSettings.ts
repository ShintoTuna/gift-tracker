import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";

// Returns the current user's settings row, or `null` if none exists
// yet (or the user isn't signed in — the LanguageGate runs this query
// at app boot before the auth gate kicks in). Callers should fall
// back to defaults from src/lib/settings.ts when null.
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

// Upsert mutation for the default currency. Creates the row if it
// doesn't exist, otherwise patches the existing row.
export const setDefaultCurrency = mutation({
  args: { currency: v.string() },
  handler: async (ctx, { currency }) => {
    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing === null) {
      await ctx.db.insert("userSettings", { userId, defaultCurrency: currency });
    } else {
      await ctx.db.patch(existing._id, { defaultCurrency: currency });
    }
  },
});

// Upsert mutation for the preferred UI language. Mirrors
// `setDefaultCurrency` — same shape, same resolver, same upsert
// semantics. The string is a two-letter language code from
// `SUPPORTED_LANGUAGES` in src/i18n/index.ts; we don't validate the
// enum on the server so adding a new locale is a client-only change.
export const setPreferredLanguage = mutation({
  args: { language: v.string() },
  handler: async (ctx, { language }) => {
    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing === null) {
      await ctx.db.insert("userSettings", { userId, preferredLanguage: language });
    } else {
      await ctx.db.patch(existing._id, { preferredLanguage: language });
    }
  },
});
