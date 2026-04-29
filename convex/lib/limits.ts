import { ConvexError } from "convex/values";

// Per-tier sanity caps. v1.0 ships with `free` only — `plus` and `pro`
// are placeholders so the architectural seam is in place when the
// paywall lands post-launch (see docs/public-release-plan.md §3 and
// "Decisions taken").
//
// Numbers chosen to comfortably cover real personal usage (PRD models
// 10–50 close relationships) while leaving headroom for keen users.
// The `occasionsPerPerson` cap is a per-parent guard — it prevents
// pathological churn from costing the user a chunk of the global
// people/idea budget by proxy.
export type SubscriptionTier = "free" | "plus" | "pro";

export type ResourceKind = "people" | "giftIdeas" | "occasionsPerPerson";

export interface TierLimits {
  maxPeople: number;
  maxGiftIdeas: number;
  maxOccasionsPerPerson: number;
}

export const LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: { maxPeople: 100, maxGiftIdeas: 200, maxOccasionsPerPerson: 20 },
  // Placeholder values — generous so a tier upgrade actually feels
  // like one once a paywall ships. Tuned later alongside pricing.
  plus: { maxPeople: 500, maxGiftIdeas: 2000, maxOccasionsPerPerson: 50 },
  pro: { maxPeople: 5000, maxGiftIdeas: 20000, maxOccasionsPerPerson: 100 },
};

const RESOURCE_TO_FIELD: Record<ResourceKind, keyof TierLimits> = {
  people: "maxPeople",
  giftIdeas: "maxGiftIdeas",
  occasionsPerPerson: "maxOccasionsPerPerson",
};

export function capFor(tier: SubscriptionTier, resource: ResourceKind): number {
  return LIMITS[tier][RESOURCE_TO_FIELD[resource]];
}

// Structured payload thrown via ConvexError so the client can render
// a friendly, translated message ("You've reached the free plan's
// 100-person limit") instead of bubbling up a raw stack-trace string.
//
// `ConvexError`'s `data` field is preserved end-to-end, so clients
// can branch on `error.data.kind === "LimitReached"` and look up the
// resource/limit/tier without parsing the message.
export interface LimitReachedData {
  kind: "LimitReached";
  resource: ResourceKind;
  limit: number;
  current: number;
  tier: SubscriptionTier;
}

export function limitReached(data: Omit<LimitReachedData, "kind">): never {
  throw new ConvexError<LimitReachedData>({ kind: "LimitReached", ...data });
}
