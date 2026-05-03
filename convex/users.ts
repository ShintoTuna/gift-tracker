import { getAuthUserId } from "@convex-dev/auth/server";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";
import { LIMITS } from "./lib/limits";

// Light "current user" surface for the Settings → Account section.
// Returns null when unauthenticated so the UI can render skeletons /
// fall back without throwing. `linkedProviders` is the set of providers
// tied to this account ("apple" | "google" | "email"), surfaced so the
// Account card can show the user how they sign in — important since
// losing access to that provider currently means losing the account.
// The Resend OTP provider's internal id is "resend-otp"; we expose it
// as "email" so the UI's i18n key lookup (`auth.account.linkedEmail`)
// stays straightforward.
const PROVIDER_DISPLAY_ID: Record<string, string> = {
  "resend-otp": "email",
};
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    const linkedProviders = Array.from(
      new Set(accounts.map((a) => PROVIDER_DISPLAY_ID[a.provider] ?? a.provider)),
    ).sort();
    return { ...user, linkedProviders };
  },
});

// Usage stats for Settings → Account ("Gift ideas: 84 / 200"). One
// query per resource counted, each capped at limit+1 so we report
// "at-limit" cleanly without scanning the full table. Returns null
// when unauthenticated.
export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const tier = user.subscriptionTier;
    const caps = LIMITS[tier];

    const peopleSlice = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(caps.maxPeople + 1);
    const ideaSlice = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(caps.maxGiftIdeas + 1);

    return {
      tier,
      people: { current: peopleSlice.length, limit: caps.maxPeople },
      giftIdeas: { current: ideaSlice.length, limit: caps.maxGiftIdeas },
    };
  },
});

// App Store guideline 5.1.1(v) requires an in-app account-deletion
// path. Cascades through every user-owned domain row plus the Convex
// Auth tables (which don't auto-cascade).
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);

    // Domain rows. Order: gift ideas → occasions → people → settings.
    const ideas = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const i of ideas) await ctx.db.delete(i._id);

    const people = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const p of people) {
      const occs = await ctx.db
        .query("occasions")
        .withIndex("by_person", (q) => q.eq("personId", p._id))
        .collect();
      for (const o of occs) await ctx.db.delete(o._id);
      await ctx.db.delete(p._id);
    }

    // Step 18: drop the user's push tokens and reminder ledger before
    // the settings row goes (settings hold the notification prefs, but
    // tokens + log are separate tables).
    const tokens = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const t of tokens) await ctx.db.delete(t._id);

    const logs = await ctx.db
      .query("notificationLog")
      .withIndex("by_user_occasion", (q) => q.eq("userId", userId))
      .collect();
    for (const l of logs) await ctx.db.delete(l._id);

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (settings) await ctx.db.delete(settings._id);

    // Convex Auth tables. Refresh tokens hang off sessions, so collect
    // sessions first and walk each one's refresh tokens before deleting
    // the session row itself.
    const authUserId = userId as Id<"users">;
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", authUserId))
      .collect();
    for (const s of sessions) {
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", s._id))
        .collect();
      for (const t of tokens) await ctx.db.delete(t._id);
      await ctx.db.delete(s._id);
    }

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", authUserId))
      .collect();
    for (const a of accounts) await ctx.db.delete(a._id);

    await ctx.db.delete(authUserId);
  },
});
