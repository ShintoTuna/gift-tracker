"use node";

import { getAuthUserId } from "@convex-dev/auth/server";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { SEED_GIFT_IDEAS, SEED_PEOPLE } from "./lib/seedData";

// Idempotent dev-data populator. Wipes everything owned by the
// signed-in user, fetches the per-record `photoUrl` / `imageUrl` from
// `seedData.ts` and stores them in Convex storage, then re-inserts
// the seed set with the resulting storage ids attached. Triggered by
// the "Seed dev data" button on the /design-system route.
//
// Runs in the Node runtime so we can hit external image hosts
// (`randomuser.me`, `picsum.photos`) — V8 actions have stricter fetch
// sandboxing. The two database passes are delegated to internal
// mutations in `seedInternal.ts` since "use node" files cannot host
// mutations.
//
// Per-image fetches are best-effort: a failed download is logged and
// the corresponding record is inserted without a storage id, falling
// back to the app's letter-avatar / color-placeholder rendering. That
// keeps a flaky CDN from breaking the whole seed run.

type SeedResult = {
  peopleCount: number;
  occasionsCount: number;
  giftIdeasCount: number;
  givingsCount: number;
};

async function uploadFromUrl(
  ctx: { storage: { store: (b: Blob) => Promise<Id<"_storage">> } },
  url: string,
): Promise<Id<"_storage"> | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`seed: image fetch ${res.status} for ${url}`);
      return null;
    }
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    return await ctx.storage.store(
      new Blob([buf], { type: contentType }),
    );
  } catch (err) {
    console.warn(`seed: image fetch threw for ${url}:`, err);
    return null;
  }
}

export const seedDevData = action({
  args: {},
  handler: async (ctx): Promise<SeedResult> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");

    await ctx.runMutation(internal.seedInternal.wipeUserData, { userId });

    // Fetch all images in parallel, then assemble the keyed maps the
    // insert mutation expects. Skip entries with no URL or a failed
    // fetch — the records will just go in without an image.
    const peopleWithUrls = SEED_PEOPLE.filter(
      (p): p is typeof p & { photoUrl: string } => Boolean(p.photoUrl),
    );
    const ideasWithUrls = SEED_GIFT_IDEAS.filter(
      (i): i is typeof i & { imageUrl: string } => Boolean(i.imageUrl),
    );

    const [photoResults, imageResults] = await Promise.all([
      Promise.all(
        peopleWithUrls.map((p) => uploadFromUrl(ctx, p.photoUrl)),
      ),
      Promise.all(
        ideasWithUrls.map((i) => uploadFromUrl(ctx, i.imageUrl)),
      ),
    ]);

    // Arrays (not records) because `v.record` validates keys as
    // ASCII field names — idea titles can contain em-dashes etc.
    const photoIdsByName: { name: string; storageId: Id<"_storage"> }[] = [];
    peopleWithUrls.forEach((p, idx) => {
      const id = photoResults[idx];
      if (id) photoIdsByName.push({ name: p.name, storageId: id });
    });

    const imageIdsByTitle: { title: string; storageId: Id<"_storage"> }[] = [];
    ideasWithUrls.forEach((i, idx) => {
      const id = imageResults[idx];
      if (id) imageIdsByTitle.push({ title: i.title, storageId: id });
    });

    return await ctx.runMutation(internal.seedInternal.insertSeedData, {
      userId,
      photoIdsByName,
      imageIdsByTitle,
    });
  },
});
