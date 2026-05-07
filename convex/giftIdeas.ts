import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { getCurrentUserId, requireCurrentUser } from "./lib/auth";
import { capFor, limitReached } from "./lib/limits";
import { resolveImageUrl } from "./lib/storage";
import {
  FIELD_LIMITS,
  assertCurrency,
  assertMaxLength,
} from "./lib/validate";

// All bounded at 1000 per Convex guideline. PRD models a single user
// over years of capture; the Backlog screen will switch to pagination
// before this becomes a concern.
const MAX_GIFT_IDEAS = 1000;

async function withImageUrl(
  ctx: QueryCtx,
  rows: Doc<"giftIdeas">[],
): Promise<(Doc<"giftIdeas"> & { imageUrl: string | null })[]> {
  return await Promise.all(
    rows.map(async (r) => ({
      ...r,
      imageUrl: await resolveImageUrl(ctx, r.imageStorageId),
    })),
  );
}

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    const rows = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_GIFT_IDEAS);
    // Personal-only wishes (`forSelf` with no tags) live exclusively
    // on the Wish List tab. Items tagged to someone *and* marked
    // `forSelf` still appear here, since they are also being
    // considered as gifts for the tagged people.
    const visible = rows.filter(
      (r) => !(r.forSelf === true && r.taggedPeople.length === 0),
    );
    return await withImageUrl(ctx, visible);
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
    const rows = all.filter((idea) => idea.taggedPeople.includes(personId));
    return await withImageUrl(ctx, rows);
  },
});

export const listByStatus = query({
  args: {
    status: v.union(v.literal("active"), v.literal("archived")),
  },
  handler: async (ctx, { status }) => {
    const userId = await getCurrentUserId(ctx);
    const rows = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", status),
      )
      .take(MAX_GIFT_IDEAS);
    return await withImageUrl(ctx, rows);
  },
});

// Powers the Wish List tab. `forSelf` was added later as
// `v.optional(v.boolean())`, so older rows have the field unset;
// the indexed query for `forSelf: true` only matches rows where
// the flag is explicitly true, which is what we want.
export const listByUserForSelf = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    const rows = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user_forSelf", (q) =>
        q.eq("userId", userId).eq("forSelf", true),
      )
      .take(MAX_GIFT_IDEAS);
    return await withImageUrl(ctx, rows);
  },
});

// Capture mutation. Defaults `status` to "active" — the capture flow
// is sub-10s so a status picker would be friction. Archiving and
// per-person givings happen later via the idea detail screen. Empty
// `taggedPeople` is allowed: the user can capture now and tag the
// right person later in Backlog.
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    sourceUrl: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    currency: v.optional(v.string()),
    taggedPeople: v.array(v.id("people")),
    forSelf: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    assertMaxLength("title", args.title, FIELD_LIMITS.giftTitle);
    assertMaxLength(
      "description",
      args.description,
      FIELD_LIMITS.giftDescription,
    );
    assertMaxLength("sourceUrl", args.sourceUrl, FIELD_LIMITS.giftSourceUrl);
    assertCurrency("currency", args.currency);

    const { userId, user } = await requireCurrentUser(ctx);
    const cap = capFor(user.subscriptionTier, "giftIdeas");
    const existing = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(cap + 1);
    if (existing.length >= cap) {
      limitReached({
        resource: "giftIdeas",
        limit: cap,
        current: existing.length,
        tier: user.subscriptionTier,
      });
    }
    const now = Date.now();
    const { forSelf, ...rest } = args;
    return await ctx.db.insert("giftIdeas", {
      userId,
      ...rest,
      // Always persist as a boolean so the `by_user_forSelf` index
      // is well-formed for new rows. Pre-existing rows with the
      // field missing aren't backfilled — the index lookup for
      // `forSelf: true` simply doesn't match them.
      forSelf: forSelf === true,
      status: "active",
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
    return {
      ...row,
      imageUrl: await resolveImageUrl(ctx, row.imageStorageId),
    };
  },
});

// Edit mutation used by the Backlog edit screen. Patch object
// mirrors the create args (minus userId, plus status). All fields
// optional — pass only what changed. `imageStorageId: null` means
// "clear it" (and free the underlying blob); omit the key to leave
// the field alone.
export const update = mutation({
  args: {
    id: v.id("giftIdeas"),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      sourceUrl: v.optional(v.string()),
      priceEstimate: v.optional(v.number()),
      currency: v.optional(v.string()),
      taggedPeople: v.optional(v.array(v.id("people"))),
      status: v.optional(
        v.union(v.literal("active"), v.literal("archived")),
      ),
      forSelf: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    assertMaxLength("title", patch.title, FIELD_LIMITS.giftTitle);
    assertMaxLength(
      "description",
      patch.description,
      FIELD_LIMITS.giftDescription,
    );
    assertMaxLength("sourceUrl", patch.sourceUrl, FIELD_LIMITS.giftSourceUrl);
    assertCurrency("currency", patch.currency);

    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not found or not authorized");
    }
    const { imageStorageId: newImage, ...rest } = patch;
    const dbPatch: Partial<Doc<"giftIdeas">> = {
      ...rest,
      updatedAt: Date.now(),
    };
    if (newImage !== undefined) {
      if (
        existing.imageStorageId &&
        existing.imageStorageId !== newImage
      ) {
        await ctx.storage.delete(existing.imageStorageId);
      }
      dbPatch.imageStorageId = newImage ?? undefined;
    }
    await ctx.db.patch(id, dbPatch);
  },
});

// Named `remove` because `delete` is a reserved word in TypeScript
// (matches the convention from convex/people.ts). Hard delete; no
// soft-delete or trash UX in MVP. Cascades to giftGivings rows
// referencing this idea.
export const remove = mutation({
  args: { id: v.id("giftIdeas") },
  handler: async (ctx, { id }) => {
    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not found or not authorized");
    }
    const givings = await ctx.db
      .query("giftGivings")
      .withIndex("by_giftIdea", (q) => q.eq("giftIdeaId", id))
      .collect();
    for (const g of givings) {
      await ctx.db.delete(g._id);
    }
    if (existing.imageStorageId) {
      await ctx.storage.delete(existing.imageStorageId);
    }
    await ctx.db.delete(id);
  },
});
