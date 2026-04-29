import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

// Resolves a Convex File Storage id to a download URL. Returns null
// for missing or unset ids so callers can render a fallback (initial
// avatar, placeholder thumbnail) without conditional chains.
export async function resolveImageUrl(
  ctx: QueryCtx | MutationCtx,
  id: Id<"_storage"> | undefined,
): Promise<string | null> {
  if (!id) return null;
  return await ctx.storage.getUrl(id);
}
