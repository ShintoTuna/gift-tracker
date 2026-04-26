import type { MutationCtx, QueryCtx } from "../_generated/server";

// Hardcoded dev identity. When auth (Convex Auth or Clerk) lands,
// this becomes:
//
//   const identity = await ctx.auth.getUserIdentity();
//   if (!identity) throw new Error("Unauthenticated");
//   return identity.tokenIdentifier;
//
// Per `convex/_generated/ai/guidelines.md`, prefer `tokenIdentifier`
// over `subject` for ownership lookups — it's the canonical stable
// identity key for a Convex auth subject. Every server-side reference
// to a user goes through this helper, so the swap is one file.
const DEV_USER_ID = "dev-user-1";

export async function getCurrentUserId(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ctx: QueryCtx | MutationCtx,
): Promise<string> {
  return DEV_USER_ID;
}
