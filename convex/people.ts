import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { getCurrentUserId, requireCurrentUser } from "./lib/auth";
import { getNextOccurrence } from "./lib/dates";
import { capFor, limitReached } from "./lib/limits";
import { resolveImageUrl } from "./lib/storage";

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
    const rows = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(500);
    return await Promise.all(
      rows.map(async (p) => ({
        ...p,
        photoUrl: await resolveImageUrl(ctx, p.photoStorageId),
      })),
    );
  },
});

// Enriched query for the People list screen: every person plus the
// computed next upcoming occasion (or null) plus the count of open
// gift ideas tagged to them ("open" = status !== "given"). Sorted
// ascending by next-occurrence date; people with no upcoming
// occasion sink to the bottom.
//
// N+1 caveat: we fan out one occasions query per person plus one
// giftIdeas query for the user. For 50 people this is fine; if it
// becomes a hotspot, denormalize a `nextOccasionDate` field onto
// `people` and update it from occasion mutations.
export const listWithNextOccasion = query({
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

    const now = Date.now();
    const enriched = await Promise.all(
      people.map(async (person) => {
        const occasions = await ctx.db
          .query("occasions")
          .withIndex("by_person", (q) => q.eq("personId", person._id))
          .take(100);

        let nextOccasion: Doc<"occasions"> | null = null;
        let nextOccasionDate: number | null = null;
        for (const occ of occasions) {
          const candidate = getNextOccurrence(occ, now);
          if (
            candidate !== null &&
            (nextOccasionDate === null || candidate < nextOccasionDate)
          ) {
            nextOccasion = occ;
            nextOccasionDate = candidate;
          }
        }

        const ideaCount = allIdeas.filter(
          (idea) =>
            idea.taggedPeople.includes(person._id) && idea.status !== "given",
        ).length;

        const hasDatelessOccasion = occasions.some((o) => o.date == null);

        return {
          ...person,
          photoUrl: await resolveImageUrl(ctx, person.photoStorageId),
          nextOccasion,
          nextOccasionDate,
          ideaCount,
          occasionCount: occasions.length,
          hasDatelessOccasion,
        };
      }),
    );

    enriched.sort((a, b) => {
      if (a.nextOccasionDate === null && b.nextOccasionDate === null) {
        return a.name.localeCompare(b.name);
      }
      if (a.nextOccasionDate === null) return 1;
      if (b.nextOccasionDate === null) return -1;
      return a.nextOccasionDate - b.nextOccasionDate;
    });

    return enriched;
  },
});

export const getById = query({
  args: { id: v.id("people") },
  handler: async (ctx, { id }) => {
    const userId = await getCurrentUserId(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) return null;
    return {
      ...row,
      photoUrl: await resolveImageUrl(ctx, row.photoStorageId),
    };
  },
});

// Single-shot profile fetch: person + their occasions (sorted by
// next-upcoming) + their gift ideas. One subscription on the client
// instead of three. Returns null if the person doesn't exist or
// belongs to another user.
export const getProfile = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const userId = await getCurrentUserId(ctx);
    const person = await ctx.db.get(personId);
    if (!person || person.userId !== userId) return null;

    const occasions = await ctx.db
      .query("occasions")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .take(100);

    const allIdeas = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(1000);
    const ideas = allIdeas.filter((idea) =>
      idea.taggedPeople.includes(personId),
    );
    const ideasWithImage = await Promise.all(
      ideas.map(async (idea) => ({
        ...idea,
        imageUrl: await resolveImageUrl(ctx, idea.imageStorageId),
      })),
    );

    const now = Date.now();
    const occasionsWithNext = occasions
      .map((o) => ({ ...o, nextDate: getNextOccurrence(o, now) }))
      .sort((a, b) => {
        if (a.nextDate === null && b.nextDate === null) return 0;
        if (a.nextDate === null) return 1;
        if (b.nextDate === null) return -1;
        return a.nextDate - b.nextDate;
      });

    return {
      person: {
        ...person,
        photoUrl: await resolveImageUrl(ctx, person.photoStorageId),
      },
      occasions: occasionsWithNext,
      ideas: ideasWithImage,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    nickname: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    relationship: v.optional(v.string()),
    interests: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireCurrentUser(ctx);
    const cap = capFor(user.subscriptionTier, "people");
    // Count via the indexed query bounded at cap+1 — that's the
    // smallest read that lets us tell "at limit" from "below limit"
    // without scanning the whole table.
    const existing = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(cap + 1);
    if (existing.length >= cap) {
      limitReached({
        resource: "people",
        limit: cap,
        current: existing.length,
        tier: user.subscriptionTier,
      });
    }
    const now = Date.now();
    return await ctx.db.insert("people", {
      userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// `photoStorageId` in the patch is a tri-state: undefined means
// "leave the field alone", a storage id means "set to this", null
// means "clear it" (and free the underlying blob). The validator
// uses `v.union(v.id, v.null())` to encode the explicit-clear case.
export const update = mutation({
  args: {
    id: v.id("people"),
    patch: v.object({
      name: v.optional(v.string()),
      nickname: v.optional(v.string()),
      photoStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      relationship: v.optional(v.string()),
      interests: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not found or not authorized");
    }
    const { photoStorageId: newPhoto, ...rest } = patch;
    const dbPatch: Partial<Doc<"people">> = {
      ...rest,
      updatedAt: Date.now(),
    };
    if (newPhoto !== undefined) {
      // Free the previous blob whenever the photo slot is being
      // replaced (or explicitly cleared) so unreferenced uploads
      // don't accumulate in storage.
      if (
        existing.photoStorageId &&
        existing.photoStorageId !== newPhoto
      ) {
        await ctx.storage.delete(existing.photoStorageId);
      }
      dbPatch.photoStorageId = newPhoto ?? undefined;
    }
    await ctx.db.patch(id, dbPatch);
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
    if (existing.photoStorageId) {
      await ctx.storage.delete(existing.photoStorageId);
    }
    await ctx.db.delete(id);
  },
});
