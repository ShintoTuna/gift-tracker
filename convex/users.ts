import { getAuthUserId } from "@convex-dev/auth/server";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";

// Light "current user" surface for the Settings → Account section.
// Returns null when unauthenticated so the UI can render skeletons /
// fall back without throwing.
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
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
