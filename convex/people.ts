import { query } from "./_generated/server";

// Wire-test query for the scaffold. Returns every row in the `people`
// table. No userId scoping yet — that lands when auth does.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("people").collect();
  },
});
