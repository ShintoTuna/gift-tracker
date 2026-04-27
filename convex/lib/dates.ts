// Date helpers for occasion math. Lives server-side so the same
// "next-occurrence" logic backs the People list and the upcoming
// Calendar screen.

type OccasionLike = {
  date?: number;
  recurrence?: "yearly" | "one_off";
};

// Returns the ms-timestamp of the next occurrence of `occasion` at or
// after `now`, or null if there's nothing upcoming. Three null cases:
//   1. The occasion has no date set ("TBD" — gift moment without
//      scheduled date).
//   2. It's a one-off whose date has passed.
//   3. It's a yearly with no date — same as case 1.
//
// Yearly recurrence projects the canonical (UTC month, day) into the
// next upcoming year. UTC arithmetic — local-timezone refinements
// come later if this proves insufficient.
export function getNextOccurrence(
  occasion: OccasionLike,
  now: number = Date.now(),
): number | null {
  if (occasion.date == null) return null;
  const recurrence = occasion.recurrence ?? "one_off";
  if (recurrence === "one_off") {
    return occasion.date >= now ? occasion.date : null;
  }
  const stored = new Date(occasion.date);
  const month = stored.getUTCMonth();
  const day = stored.getUTCDate();
  const today = new Date(now);
  let candidate = Date.UTC(today.getUTCFullYear(), month, day);
  if (candidate < now) {
    candidate = Date.UTC(today.getUTCFullYear() + 1, month, day);
  }
  return candidate;
}
