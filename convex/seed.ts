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

    // 1. Wipe gift ideas (own userId, no FKs to follow).
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
    // `givenForOccasionTitle` on "given" gift ideas back to a real
    // occasion id.
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

    // 5. Insert gift ideas, resolving tagged-people names to ids and
    //    given-for-occasion to the matching seeded occasion.
    for (const seed of SEED_GIFT_IDEAS) {
      const taggedPeople: Id<"people">[] = [];
      for (const name of seed.taggedPersonNames) {
        const id = personIdByName.get(name);
        if (id) taggedPeople.push(id);
      }
      const givenTo = seed.givenToPersonName
        ? personIdByName.get(seed.givenToPersonName)
        : undefined;
      const givenForOccasionId =
        seed.givenToPersonName && seed.givenForOccasionTitle
          ? occasionIdByPersonAndTitle
              .get(seed.givenToPersonName)
              ?.get(seed.givenForOccasionTitle)
          : undefined;
      await ctx.db.insert("giftIdeas", {
        userId,
        title: seed.title,
        description: seed.description,
        sourceUrl: seed.sourceUrl,
        priceEstimate: seed.priceEstimate,
        currency: seed.currency,
        taggedPeople,
        status: seed.status,
        givenTo,
        givenAt: seed.givenAt,
        givenForOccasionId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      peopleCount: SEED_PEOPLE.length,
      occasionsCount,
      giftIdeasCount: SEED_GIFT_IDEAS.length,
    };
  },
});
