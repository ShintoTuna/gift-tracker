import { v } from "convex/values";

import { query } from "./_generated/server";
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
