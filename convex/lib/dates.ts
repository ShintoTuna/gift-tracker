// Date helpers for occasion math. Lives server-side so the same
// "next-occurrence" logic backs the People list and the upcoming
// Calendar screen.

type OccasionLike = {
  date: number;
  recurrence: "yearly" | "one_off";
};

// Returns the ms-timestamp of the next occurrence of `occasion` at or
// after `now`, or null if it's a one-off in the past. Yearly
// recurrence projects the canonical (month, day) into the next
// upcoming year. UTC arithmetic — local-timezone refinements come
// later if this proves insufficient.
export function getNextOccurrence(
  occasion: OccasionLike,
  now: number = Date.now(),
): number | null {
  if (occasion.recurrence === "one_off") {
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
