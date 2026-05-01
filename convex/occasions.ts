import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getCurrentUserId, requireCurrentUser } from "./lib/auth";
import { getNextOccurrence } from "./lib/dates";
import { capFor, limitReached } from "./lib/limits";
import { resolveImageUrl } from "./lib/storage";
import { FIELD_LIMITS, assertMaxLength } from "./lib/validate";

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

// Calendar query: every occasion the user owns, enriched with the
// parent person and the computed next-occurrence date (or null for
// truly dateless / TBD entries). Past one-offs are filtered out
// (their nextDate is null and their date is set, so they neither
// belong in the agenda nor in the "Pending dates" section).
//
// Sorted ascending by next-occurrence date; null nextDate (TBD)
// rows sink to the bottom for the client to bucket separately.
//
// N+1 caveat: one occasions query per person, plus one giftIdeas
// query for the user's idea-count rollup. Same shape as
// listWithNextOccasion in convex/people.ts. Matters only past ~50
// people; if it does, denormalize as suggested there.
export const listUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);

    const people = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(500);

    const allIdeas = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(1000);

    // Pre-roll the active-idea count per person so each agenda row
    // can surface "n ideas" without a separate per-row pass. Archived
    // ideas are kept for history but don't count toward this agenda.
    const ideaCountByPerson = new Map<string, number>();
    for (const idea of allIdeas) {
      if (idea.status !== "active") continue;
      for (const personId of idea.taggedPeople) {
        ideaCountByPerson.set(
          personId,
          (ideaCountByPerson.get(personId) ?? 0) + 1,
        );
      }
    }

    const now = Date.now();
    const enriched = [];
    for (const person of people) {
      const occasions = await ctx.db
        .query("occasions")
        .withIndex("by_person", (q) => q.eq("personId", person._id))
        .take(100);
      const ideaCount = ideaCountByPerson.get(person._id) ?? 0;
      // Resolve once per person so back-to-back occasion rows share
      // the same photo URL without an extra round trip each.
      const photoUrl = await resolveImageUrl(ctx, person.photoStorageId);
      const personWithPhoto = { ...person, photoUrl };
      for (const occ of occasions) {
        const nextDate = getNextOccurrence(occ, now);
        // Include if upcoming OR truly dateless (TBD). Skip past
        // one-offs (date set, nextDate null) — they're history, not
        // agenda items.
        if (nextDate !== null || occ.date == null) {
          enriched.push({
            occasion: occ,
            person: personWithPhoto,
            nextDate,
            ideaCount,
          });
        }
      }
    }

    enriched.sort((a, b) => {
      if (a.nextDate === null && b.nextDate === null) {
        return a.occasion.title.localeCompare(b.occasion.title);
      }
      if (a.nextDate === null) return 1;
      if (b.nextDate === null) return -1;
      return a.nextDate - b.nextDate;
    });

    return enriched;
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
    assertMaxLength("title", args.title, FIELD_LIMITS.occasionTitle);

    const { userId, user } = await requireCurrentUser(ctx);
    // Confirm the parent person belongs to this user before
    // allowing an occasion attached to it.
    const person = await ctx.db.get(args.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Not found or not authorized");
    }
    const cap = capFor(user.subscriptionTier, "occasionsPerPerson");
    const existing = await ctx.db
      .query("occasions")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .take(cap + 1);
    if (existing.length >= cap) {
      limitReached({
        resource: "occasionsPerPerson",
        limit: cap,
        current: existing.length,
        tier: user.subscriptionTier,
      });
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
    assertMaxLength("title", patch.title, FIELD_LIMITS.occasionTitle);

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
// Hard delete. `giftGivings` rows referencing this occasion are
// detached (occasionId cleared) so they don't dangle to a deleted
// occasion id.
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
    const givings = await ctx.db
      .query("giftGivings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const g of givings) {
      if (g.occasionId === id) {
        await ctx.db.patch(g._id, { occasionId: undefined });
      }
    }
    await ctx.db.delete(id);
  },
});
