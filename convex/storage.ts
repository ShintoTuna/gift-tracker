import { mutation } from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";

// Issues a one-time, signed upload URL for the client to PUT a blob
// against. Auth-gated so anonymous traffic can't burn storage quota.
//
// The URL response includes the resulting `storageId`; the client
// then passes that id back through the relevant create/update
// mutation (people.update / giftIdeas.update / etc.) which writes
// the id onto the row.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
