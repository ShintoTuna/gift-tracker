import { ConvexError } from "convex/values";
import type { TFunction } from "i18next";

// Mirror of `LimitReachedData` from `convex/lib/limits.ts`. We don't
// import that module from the client because the convex/ folder is
// owned by the server bundle; duplicating the shape is cheaper than
// threading the import.
export type LimitResource = "people" | "giftIdeas" | "occasionsPerPerson";

export type SubscriptionTier = "free" | "plus" | "pro";

export interface LimitReachedData {
  kind: "LimitReached";
  resource: LimitResource;
  limit: number;
  current: number;
  tier: SubscriptionTier;
}

function isLimitReached(data: unknown): data is LimitReachedData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    d.kind === "LimitReached" &&
    typeof d.resource === "string" &&
    typeof d.limit === "number"
  );
}

// Pulls the structured limit-reached payload out of an error, or
// returns null. Lets call sites switch between the friendly sheet UI
// and a generic alert without re-checking the ConvexError shape.
export function getLimitReachedData(err: unknown): LimitReachedData | null {
  if (err instanceof ConvexError && isLimitReached(err.data)) {
    return err.data;
  }
  return null;
}

// Returns a translated, user-facing message for any error thrown by
// a Convex mutation. Friendly for known structured errors
// (`LimitReached`); falls back to `error.message` for everything else
// so unexpected failures still surface a useful string.
export function describeMutationError(err: unknown, t: TFunction): string {
  const limit = getLimitReachedData(err);
  if (limit) {
    return t(`limits.${limit.resource}`, { count: limit.limit });
  }
  return err instanceof Error ? err.message : String(err);
}
