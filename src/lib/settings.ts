import { useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";

// Initial fallback currency. Used when the user hasn't set one in
// the Settings screen yet (or when the Convex query is still
// resolving). Lives as a constant so any future cold-start default
// can change in one place.
export const DEFAULT_CURRENCY = "EUR";

// Reactive accessor for the user's chosen default currency. Reads
// from `api.userSettings.get`, falls back to `DEFAULT_CURRENCY`
// while the query is loading or if no preference is set yet.
//
// Components rendering price labels or attaching `currency` to
// mutations should use this hook (not the constant) so currency
// changes from the Settings screen propagate everywhere reactively.
export function useDefaultCurrency(): string {
  const settings = useQuery(api.userSettings.get);
  return settings?.defaultCurrency ?? DEFAULT_CURRENCY;
}

// Future candidates that will land here as features arrive:
// - DEFAULT_REMINDER_DAYS_AHEAD (notifications threshold)
// - PREFERRED_AI_MODEL          (Claude Haiku vs Sonnet)
// - LOCALE                      (date / number formatting)
