import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// `userId` columns on user-scoped tables stay `v.string()`. Convex
// Auth's `Id<"users">` is a branded string at runtime, so existing
// `q.eq("userId", userId)` filters keep working without a column-type
// migration.

export default defineSchema({
  ...authTables,
  // Convex Auth owns the `users` table; we extend its base validator
  // (name, email, image, phone, ...) with our custom domain fields. The
  // index is renamed to `email` (Convex Auth's expected name) so its
  // own lookups hit the right index.
  users: defineTable({
    ...authTables.users.validator.fields,
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("plus"),
      v.literal("pro"),
    ),
    aiUsageThisPeriod: v.number(),
    acceptedTermsVersion: v.optional(v.string()),
    acceptedTermsAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("email", ["email"]),

  people: defineTable({
    userId: v.string(),
    name: v.string(),
    nickname: v.optional(v.string()),
    // Convex File Storage handle. Queries resolve it to a download URL
    // before returning rows to the client (see convex/lib/storage.ts).
    photoStorageId: v.optional(v.id("_storage")),
    relationship: v.optional(v.string()),
    interests: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  occasions: defineTable({
    personId: v.id("people"),
    title: v.string(),
    date: v.optional(v.number()),
    recurrence: v.optional(
      v.union(v.literal("yearly"), v.literal("one_off")),
    ),
  })
    .index("by_person", ["personId"])
    .index("by_date", ["date"]),

  // User-scoped preferences. Keyed by userId so the lookup pattern
  // mirrors the rest of the app (people, giftIdeas) and the auth
  // swap is a single-resolver change. New optional fields slot in
  // here when features need them (notification timings, etc.).
  userSettings: defineTable({
    userId: v.string(),
    defaultCurrency: v.optional(v.string()),
    // Two-letter language code from `SUPPORTED_LANGUAGES` in
    // src/i18n/index.ts (e.g. "en", "ru"). Optional because new
    // installs default to the device locale via expo-localization.
    preferredLanguage: v.optional(v.string()),
    // Push-notification prefs. All optional — pre-Step-18 rows have
    // none of these and the cron skips users with `enabled !== true`.
    notificationsEnabled: v.optional(v.boolean()),
    // Arbitrary positive integers (e.g. [1, 7, 30]). The Settings
    // screen lets the user add/remove freely; server caps to ≤10.
    notificationDaysAhead: v.optional(v.array(v.number())),
    // Minutes since local midnight, 0..1439.
    notificationTimeOfDayMinutes: v.optional(v.number()),
    // IANA timezone (e.g. "Europe/Berlin"); captured from device on
    // first opt-in. The cron uses it to map "user's 9am" to the right
    // UTC hour.
    notificationTimezone: v.optional(v.string()),
    // Sentry crash/error reporting opt-out. Missing = treat as enabled
    // (default-on). The boot-time gate reads an AsyncStorage mirror of
    // this so it can decide pre-auth.
    errorReportsEnabled: v.optional(v.boolean()),
    // Set after the user dismisses the post-signup welcome screen.
    // Missing = false; the AuthGate routes signed-in users without
    // this flag to /welcome before letting them into the tabs.
    hasSeenWelcome: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  // One row per device that has opted in. Multiple rows per user are
  // expected (phone + iPad). Pruned on Expo `DeviceNotRegistered`.
  pushTokens: defineTable({
    userId: v.string(),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"]),

  // Dedupe ledger so a yearly birthday's "7 days ahead" reminder
  // doesn't re-send within the same year. Keyed on the target
  // occurrence date, so next year's reminder for the same occasion
  // is a different row.
  notificationLog: defineTable({
    userId: v.string(),
    occasionId: v.id("occasions"),
    occurrenceDate: v.number(),
    daysAhead: v.number(),
    sentAt: v.number(),
  }).index("by_user_occasion", [
    "userId",
    "occasionId",
    "occurrenceDate",
    "daysAhead",
  ]),

  giftIdeas: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    sourceUrl: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    currency: v.optional(v.string()),
    // A gift idea is tagged to one or more people, not to an
    // occasion (PRD §6 design note).
    taggedPeople: v.array(v.id("people")),
    // Two-state for now (open idea vs. given). The enum shape stays
    // so a future status (e.g. "wrapped", "delivered") can land
    // without a schema-shape change — just a new literal.
    status: v.union(v.literal("idea"), v.literal("given")),
    givenTo: v.optional(v.id("people")),
    givenAt: v.optional(v.number()),
    givenForOccasionId: v.optional(v.id("occasions")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),
});
