// User-scoped settings — hardcoded for now. When the
// Profile/Settings screen lands, this module becomes the resolver
// (reading from a `userSettings` Convex table) and consumers don't
// need to change. Keep all hardcoded preferences here so the swap is
// a single-file edit.

export const DEFAULT_CURRENCY = "EUR";

// Future candidates that will land here as features arrive:
// - DEFAULT_REMINDER_DAYS_AHEAD (notifications threshold)
// - PREFERRED_AI_MODEL          (Claude Haiku vs Sonnet)
// - LOCALE                      (date / number formatting)
