import { getAuthUserId } from "@convex-dev/auth/server";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

// `getAuthUserId` returns `Id<"users"> | null`. The branded `Id` is a
// string at runtime, so existing `q.eq("userId", userId)` calls keep
// working unchanged.
export async function getCurrentUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Unauthenticated");
  return userId;
}

// Resolves the current user row alongside the id. Mutations that
// gate on subscription tier (limits enforcement, future paywall)
// need both, and pulling them in one place keeps the call sites
// from re-loading the same doc.
export async function requireCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<{ userId: string; user: Doc<"users"> }> {
  const userId = await getCurrentUserId(ctx);
  const user = await ctx.db.get(userId as Id<"users">);
  if (!user) throw new Error("Unauthenticated");
  return { userId, user };
}
