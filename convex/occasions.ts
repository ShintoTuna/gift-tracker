import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";

// Returns occasions for a single person, ordered by their stored
// canonical date. The Calendar screen will need a separate
// "next-occurrence" query that handles yearly recurrence; that lands
// alongside the Calendar UI.
//
// Bounded at 100 per Convex guideline. A person realistically has
// 1-5 occasions; 100 is generous headroom.
export const listByPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const userId = await getCurrentUserId(ctx);
    // Ownership check via the person row; no userId on occasions.
    const person = await ctx.db.get(personId);
    if (!person || person.userId !== userId) return [];
    return await ctx.db
      .query("occasions")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .take(100);
  },
});

// Single-row fetch for the edit modal. Ownership-checked via the
// parent person, since occasions don't carry userId directly.
export const getById = query({
  args: { id: v.id("occasions") },
  handler: async (ctx, { id }) => {
    const userId = await getCurrentUserId(ctx);
    const occ = await ctx.db.get(id);
    if (!occ) return null;
    const person = await ctx.db.get(occ.personId);
    if (!person || person.userId !== userId) return null;
    return occ;
  },
});

const recurrenceValidator = v.optional(
  v.union(v.literal("yearly"), v.literal("one_off")),
);

export const create = mutation({
  args: {
    personId: v.id("people"),
    title: v.string(),
    date: v.optional(v.number()),
    recurrence: recurrenceValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    // Confirm the parent person belongs to this user before
    // allowing an occasion attached to it.
    const person = await ctx.db.get(args.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Not found or not authorized");
    }
    return await ctx.db.insert("occasions", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("occasions"),
    patch: v.object({
      title: v.optional(v.string()),
      date: v.optional(v.number()),
      recurrence: recurrenceValidator,
    }),
  },
  handler: async (ctx, { id, patch }) => {
    const userId = await getCurrentUserId(ctx);
    const occ = await ctx.db.get(id);
    if (!occ) throw new Error("Not found");
    const person = await ctx.db.get(occ.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(id, patch);
  },
});

// Named `remove` because `delete` is a reserved word in TypeScript.
// Hard delete; gift ideas referencing this occasion via
// `givenForOccasionId` are left dangling (we don't have a UX yet
// that surfaces the linkage, so cascading isn't useful for MVP).
export const remove = mutation({
  args: { id: v.id("occasions") },
  handler: async (ctx, { id }) => {
    const userId = await getCurrentUserId(ctx);
    const occ = await ctx.db.get(id);
    if (!occ) throw new Error("Not found");
    const person = await ctx.db.get(occ.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(id);
  },
});
