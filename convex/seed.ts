import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUserId } from "./lib/auth";
import {
  SEED_GIFT_IDEAS,
  SEED_OCCASIONS,
  SEED_PEOPLE,
} from "./lib/seedData";

// Idempotent dev-data populator. Wipes everything owned by the
// current dev user, then re-inserts the seed set. Triggered by the
// "Seed dev data" button on the /design-system route.
//
// Returns counts so the UI can confirm the run.
export const seedDevData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);

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

    const now = Date.now();

    // 3. Insert people, building a name → id map for FK resolution
    //    in the next two passes.
    const personIdByName = new Map<string, Id<"people">>();
    for (const seed of SEED_PEOPLE) {
      const id = await ctx.db.insert("people", {
        userId,
        name: seed.name,
        nickname: seed.nickname,
        relationship: seed.relationship,
        interests: seed.interests,
        createdAt: now,
        updatedAt: now,
      });
      personIdByName.set(seed.name, id);
    }

    // 4. Insert occasions keyed to person ids.
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

    // 5. Insert gift ideas, plus any seeded givings as separate
    //    `giftGivings` rows.
    let givingsCount = 0;
    for (const seed of SEED_GIFT_IDEAS) {
      const taggedPeople: Id<"people">[] = [];
      for (const name of seed.taggedPersonNames) {
        const id = personIdByName.get(name);
        if (id) taggedPeople.push(id);
      }
      const giftIdeaId = await ctx.db.insert("giftIdeas", {
        userId,
        title: seed.title,
        description: seed.description,
        sourceUrl: seed.sourceUrl,
        priceEstimate: seed.priceEstimate,
        currency: seed.currency,
        taggedPeople,
        status: seed.status,
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
