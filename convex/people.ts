import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";

// Returns the current user's people. No userId scoping argument —
// that's resolved server-side via getCurrentUserId so callers can't
// query someone else's rows.
//
// Bounded at 500 per Convex guideline (always cap unbounded reads).
// PRD targets 10-50 close relationships per user, so this is ~10x
// headroom. Switch to pagination if anyone realistically approaches.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    return await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(500);
  },
});

export const getById = query({
  args: { id: v.id("people") },
  handler: async (ctx, { id }) => {
    const userId = await getCurrentUserId(ctx);
    const row = await ctx.db.get(id);
    // Guard against accessing other users' rows once auth lands.
    if (row && row.userId !== userId) return null;
    return row;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    nickname: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    relationship: v.optional(v.string()),
    interests: v.array(v.string()),
    notes: v.optional(v.string()),
    dateMet: v.optional(v.number()),
    dateOfBirth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert("people", {
      userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("people"),
    patch: v.object({
      name: v.optional(v.string()),
      nickname: v.optional(v.string()),
      photoUrl: v.optional(v.string()),
      relationship: v.optional(v.string()),
      interests: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      dateMet: v.optional(v.number()),
      dateOfBirth: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not found or not authorized");
    }
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

// Named `remove` because `delete` is a reserved word in TypeScript.
export const remove = mutation({
  args: { id: v.id("people") },
  handler: async (ctx, { id }) => {
    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not found or not authorized");
    }
    // Cascade: delete this person's occasions and detach them from
    // gift ideas. (Gift idea rows with no remaining tagged people are
    // left in place — they belong to the user, not the person.)
    //
    // .collect() is acceptable here: the cascade is internal cleanup
    // bounded by the user's own data (PRD: 10-50 people, hundreds of
    // ideas). If the dataset ever approaches Convex's transaction
    // limits, batch via .take(n) + ctx.scheduler.runAfter to continue
    // (per Convex guidelines).
    const personOccasions = await ctx.db
      .query("occasions")
      .withIndex("by_person", (q) => q.eq("personId", id))
      .collect();
    for (const occ of personOccasions) {
      await ctx.db.delete(occ._id);
    }
    const userIdeas = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const idea of userIdeas) {
      if (idea.taggedPeople.includes(id)) {
        await ctx.db.patch(idea._id, {
          taggedPeople: idea.taggedPeople.filter((p) => p !== id),
          updatedAt: Date.now(),
        });
      }
    }
    await ctx.db.delete(id);
  },
});
