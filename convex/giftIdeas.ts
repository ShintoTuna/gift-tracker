import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";

// All bounded at 1000 per Convex guideline. PRD models a single user
// over years of capture; the Backlog screen will switch to pagination
// before this becomes a concern.
const MAX_GIFT_IDEAS = 1000;

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    return await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_GIFT_IDEAS);
  },
});

// `taggedPeople` is an array column, so there's no equality index for
// "tagged with this person." We pull the user's ideas via the indexed
// query and post-filter in memory. Fine at expected dataset size; if
// gift ideas ever balloon past the bound, switch to a dedicated
// taggings join table.
export const listByPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const userId = await getCurrentUserId(ctx);
    const all = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_GIFT_IDEAS);
    return all.filter((idea) => idea.taggedPeople.includes(personId));
  },
});

export const listByStatus = query({
  args: {
    status: v.union(v.literal("idea"), v.literal("given")),
  },
  handler: async (ctx, { status }) => {
    const userId = await getCurrentUserId(ctx);
    return await ctx.db
      .query("giftIdeas")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", status),
      )
      .take(MAX_GIFT_IDEAS);
  },
});

// Capture mutation. Defaults `status` to "idea" — the capture flow is
// sub-10s so a status picker would be friction. Status transitions
// (planned → purchased → given) happen later via the Backlog and
// Profile screens. Empty `taggedPeople` is allowed: the user can
// capture now and tag the right person later in Backlog.
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    currency: v.optional(v.string()),
    taggedPeople: v.array(v.id("people")),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert("giftIdeas", {
      userId,
      ...args,
      status: "idea",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getById = query({
  args: { id: v.id("giftIdeas") },
  handler: async (ctx, { id }) => {
    const userId = await getCurrentUserId(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) return null;
    return row;
  },
});

// Edit mutation used by the Backlog edit screen. Patch object
// mirrors the create args (minus userId, plus status). All fields
// optional — pass only what changed.
export const update = mutation({
  args: {
    id: v.id("giftIdeas"),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      sourceUrl: v.optional(v.string()),
      priceEstimate: v.optional(v.number()),
      currency: v.optional(v.string()),
      taggedPeople: v.optional(v.array(v.id("people"))),
      status: v.optional(
        v.union(v.literal("idea"), v.literal("given")),
      ),
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

// Named `remove` because `delete` is a reserved word in TypeScript
// (matches the convention from convex/people.ts). Hard delete; no
// soft-delete or trash UX in MVP.
export const remove = mutation({
  args: { id: v.id("giftIdeas") },
  handler: async (ctx, { id }) => {
    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not found or not authorized");
    }
    await ctx.db.delete(id);
  },
});
