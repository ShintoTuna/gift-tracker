import { ConvexError } from "convex/values";
import type { TFunction } from "i18next";

// Mirror of `LimitReachedData` from `convex/lib/limits.ts`. We don't
// import that module from the client because the convex/ folder is
// owned by the server bundle; duplicating the shape (3 string
// literals, 2 numbers) is cheaper than threading the import.
type LimitResource = "people" | "giftIdeas" | "occasionsPerPerson";

interface LimitReachedData {
  kind: "LimitReached";
  resource: LimitResource;
  limit: number;
  current: number;
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

// Returns a translated, user-facing message for any error thrown by
// a Convex mutation. Friendly for known structured errors
// (`LimitReached`); falls back to `error.message` for everything else
// so unexpected failures still surface a useful string.
export function describeMutationError(err: unknown, t: TFunction): string {
  if (err instanceof ConvexError && isLimitReached(err.data)) {
    return t(`limits.${err.data.resource}`, { count: err.data.limit });
  }
  return err instanceof Error ? err.message : String(err);
}
