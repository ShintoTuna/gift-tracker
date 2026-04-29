import { getAuthUserId } from "@convex-dev/auth/server";

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
