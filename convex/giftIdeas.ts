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
    status: v.union(
      v.literal("idea"),
      v.literal("planned"),
      v.literal("purchased"),
      v.literal("given"),
    ),
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
