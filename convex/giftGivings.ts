import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";

const MAX_GIVINGS_PER_USER = 5000;
const MAX_GIVINGS_PER_IDEA = 200;
const MAX_GIVINGS_PER_PERSON = 1000;

async function loadOwnedIdea(
  ctx: QueryCtx,
  giftIdeaId: Id<"giftIdeas">,
  userId: string,
): Promise<Doc<"giftIdeas"> | null> {
  const idea = await ctx.db.get(giftIdeaId);
  if (!idea || idea.userId !== userId) return null;
  return idea;
}

async function loadOwnedPerson(
  ctx: QueryCtx,
  personId: Id<"people">,
  userId: string,
): Promise<Doc<"people"> | null> {
  const person = await ctx.db.get(personId);
  if (!person || person.userId !== userId) return null;
  return person;
}

// Record a giving event. Multiple rows per (idea, person) are
// allowed — re-gifting the same idea to the same person on a later
// occasion is a real flow.
export const addGiving = mutation({
  args: {
    giftIdeaId: v.id("giftIdeas"),
    personId: v.id("people"),
    givenAt: v.number(),
    occasionId: v.optional(v.id("occasions")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    const idea = await loadOwnedIdea(ctx, args.giftIdeaId, userId);
    if (!idea) throw new Error("Gift idea not found or not authorized");
    const person = await loadOwnedPerson(ctx, args.personId, userId);
    if (!person) throw new Error("Person not found or not authorized");
    if (args.occasionId) {
      const occasion = await ctx.db.get(args.occasionId);
      if (!occasion || occasion.personId !== args.personId) {
        throw new Error("Occasion does not belong to this person");
      }
    }
    const now = Date.now();
    return await ctx.db.insert("giftGivings", {
      userId,
      giftIdeaId: args.giftIdeaId,
      personId: args.personId,
      givenAt: args.givenAt,
      occasionId: args.occasionId,
      note: args.note,
      createdAt: now,
    });
  },
});

export const removeGiving = mutation({
  args: { id: v.id("giftGivings") },
  handler: async (ctx, { id }) => {
    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not found or not authorized");
    }
    await ctx.db.delete(id);
  },
});

// All givings for a single idea. Newest first, denormalized with
// person + occasion for the idea-detail "Givings" list.
export const listByIdea = query({
  args: { giftIdeaId: v.id("giftIdeas") },
  handler: async (ctx, { giftIdeaId }) => {
    const userId = await getCurrentUserId(ctx);
    const idea = await loadOwnedIdea(ctx, giftIdeaId, userId);
    if (!idea) return [];
    const rows = await ctx.db
      .query("giftGivings")
      .withIndex("by_giftIdea", (q) => q.eq("giftIdeaId", giftIdeaId))
      .take(MAX_GIVINGS_PER_IDEA);
    rows.sort((a, b) => b.givenAt - a.givenAt);
    return await Promise.all(
      rows.map(async (g) => {
        const person = await ctx.db.get(g.personId);
        const occasion = g.occasionId
          ? await ctx.db.get(g.occasionId)
          : null;
        return {
          ...g,
          personName: person?.name ?? null,
          personNickname: person?.nickname ?? null,
          occasionTitle: occasion?.title ?? null,
        };
      }),
    );
  },
});

// Distinct ideas given to one person, with the most-recent giving
// date and occasion. Used by the profile screen "Given to {name}"
// section so each idea shows once with its latest giving caption.
export const listIdeasByPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const userId = await getCurrentUserId(ctx);
    const person = await loadOwnedPerson(ctx, personId, userId);
    if (!person) return [];
    const rows = await ctx.db
      .query("giftGivings")
      .withIndex("by_user_person", (q) =>
        q.eq("userId", userId).eq("personId", personId),
      )
      .take(MAX_GIVINGS_PER_PERSON);
    // Reduce to one entry per idea, keeping the most recent giving.
    const latestByIdea = new Map<Id<"giftIdeas">, Doc<"giftGivings">>();
    for (const g of rows) {
      const prev = latestByIdea.get(g.giftIdeaId);
      if (!prev || g.givenAt > prev.givenAt) {
        latestByIdea.set(g.giftIdeaId, g);
      }
    }
    const ordered = [...latestByIdea.values()].sort(
      (a, b) => b.givenAt - a.givenAt,
    );
    return await Promise.all(
      ordered.map(async (g) => {
        const occasion = g.occasionId
          ? await ctx.db.get(g.occasionId)
          : null;
        return {
          givingId: g._id,
          giftIdeaId: g.giftIdeaId,
          givenAt: g.givenAt,
          occasionId: g.occasionId ?? null,
          occasionTitle: occasion?.title ?? null,
        };
      }),
    );
  },
});

// Internal helper for queries that need to know whether an idea has
// any givings to a given person. Bounded loop terminates on first
// match.
export async function hasGivingForIdeaPerson(
  ctx: QueryCtx,
  userId: string,
  giftIdeaId: Id<"giftIdeas">,
  personId: Id<"people">,
): Promise<boolean> {
  const row = await ctx.db
    .query("giftGivings")
    .withIndex("by_user_idea_person", (q) =>
      q
        .eq("userId", userId)
        .eq("giftIdeaId", giftIdeaId)
        .eq("personId", personId),
    )
    .first();
  return row !== null;
}

// Pre-rolled set of (ideaId, personId) keys that have at least one
// giving for the current user. Cheaper than per-row lookups when the
// caller already has many ideas to check.
export async function loadGivenSetForUser(
  ctx: QueryCtx,
  userId: string,
): Promise<Set<string>> {
  const rows = await ctx.db
    .query("giftGivings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(MAX_GIVINGS_PER_USER);
  const out = new Set<string>();
  for (const r of rows) {
    out.add(`${r.giftIdeaId}::${r.personId}`);
  }
  return out;
}
