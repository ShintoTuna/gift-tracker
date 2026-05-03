import { v } from "convex/values";

import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  SEED_GIFT_IDEAS,
  SEED_OCCASIONS,
  SEED_PEOPLE,
} from "./lib/seedData";

// V8-runtime internal mutations called by the `seedDevData` action in
// `convex/seed.ts`. The split exists because the action needs the Node
// runtime (`"use node"`) for `fetch` against image CDNs, and "use node"
// files cannot also export mutations.

export const wipeUserData = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // 1. Wipe gift ideas + their giving history.
    const oldGivings = await ctx.db
      .query("giftGivings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const g of oldGivings) {
      await ctx.db.delete(g._id);
    }
    const oldIdeas = await ctx.db
      .query("giftIdeas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const idea of oldIdeas) {
      await ctx.db.delete(idea._id);
    }

    // 2. Wipe occasions belonging to this user's people, then the
    //    people themselves.
    const oldPeople = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const person of oldPeople) {
      const personOccasions = await ctx.db
        .query("occasions")
        .withIndex("by_person", (q) => q.eq("personId", person._id))
        .collect();
      for (const occ of personOccasions) {
        await ctx.db.delete(occ._id);
      }
      await ctx.db.delete(person._id);
    }
  },
});

export const insertSeedData = internalMutation({
  args: {
    userId: v.string(),
    // Storage ids resolved by the action after uploading each
    // `photoUrl` / `imageUrl`. Passed as arrays (not records) because
    // `v.record` keys are validated as ASCII field names — idea
    // titles can contain characters like em-dashes that fail that
    // check.
    photoIdsByName: v.array(
      v.object({ name: v.string(), storageId: v.id("_storage") }),
    ),
    imageIdsByTitle: v.array(
      v.object({ title: v.string(), storageId: v.id("_storage") }),
    ),
  },
  handler: async (
    ctx,
    { userId, photoIdsByName, imageIdsByTitle },
  ) => {
    const now = Date.now();
    const photoIdByName = new Map(
      photoIdsByName.map((p) => [p.name, p.storageId]),
    );
    const imageIdByTitle = new Map(
      imageIdsByTitle.map((i) => [i.title, i.storageId]),
    );

    // 1. Insert people, building a name → id map for FK resolution
    //    in the next two passes.
    const personIdByName = new Map<string, Id<"people">>();
    for (const seed of SEED_PEOPLE) {
      const photoStorageId = photoIdByName.get(seed.name);
      const id = await ctx.db.insert("people", {
        userId,
        name: seed.name,
        nickname: seed.nickname,
        relationship: seed.relationship,
        interests: seed.interests,
        photoStorageId,
        createdAt: now,
        updatedAt: now,
      });
      personIdByName.set(seed.name, id);
    }

    // 2. Insert occasions keyed to person ids.
    let occasionsCount = 0;
    // Lookup map keyed by title — used in the next pass to resolve
    // each seeded giving's `occasionTitle` back to a real occasion
    // id.
    const occasionIdByPersonAndTitle = new Map<
      string,
      Map<string, Id<"occasions">>
    >();
    for (const [personName, occasions] of Object.entries(SEED_OCCASIONS)) {
      const personId = personIdByName.get(personName);
      if (!personId) continue;
      const byTitle = new Map<string, Id<"occasions">>();
      for (const occ of occasions) {
        const id = await ctx.db.insert("occasions", {
          personId,
          title: occ.title,
          date: occ.date,
          recurrence: occ.recurrence,
        });
        byTitle.set(occ.title, id);
        occasionsCount += 1;
      }
      occasionIdByPersonAndTitle.set(personName, byTitle);
    }

    // 3. Insert gift ideas, plus any seeded givings as separate
    //    `giftGivings` rows.
    let givingsCount = 0;
    for (const seed of SEED_GIFT_IDEAS) {
      const taggedPeople: Id<"people">[] = [];
      for (const name of seed.taggedPersonNames) {
        const id = personIdByName.get(name);
        if (id) taggedPeople.push(id);
      }
      const imageStorageId = imageIdByTitle.get(seed.title);
      const giftIdeaId = await ctx.db.insert("giftIdeas", {
        userId,
        title: seed.title,
        description: seed.description,
        sourceUrl: seed.sourceUrl,
        priceEstimate: seed.priceEstimate,
        currency: seed.currency,
        taggedPeople,
        status: seed.status,
        imageStorageId,
        createdAt: now,
        updatedAt: now,
      });
      for (const giving of seed.givings ?? []) {
        const personId = personIdByName.get(giving.personName);
        if (!personId) continue;
        const occasionId = giving.occasionTitle
          ? occasionIdByPersonAndTitle
              .get(giving.personName)
              ?.get(giving.occasionTitle)
          : undefined;
        await ctx.db.insert("giftGivings", {
          userId,
          giftIdeaId,
          personId,
          givenAt: giving.givenAt,
          occasionId,
          createdAt: now,
        });
        givingsCount += 1;
      }
    }

    return {
      peopleCount: SEED_PEOPLE.length,
      occasionsCount,
      giftIdeasCount: SEED_GIFT_IDEAS.length,
      givingsCount,
    };
  },
});
