import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Base schemas for Giftsmith — see /docs/PRD.md §6.
//
// `userId` is intentionally `v.string()` (not `v.id("users")`). Auth
// is a future step; once Convex Auth or Clerk lands, the auth
// provider's identity becomes the canonical user ref. Keeping
// `userId` as a string lets us swap the source of that string without
// a schema rewrite.

export default defineSchema({
  // Defined now so the data-model surface is stable, but unused until
  // auth wiring lands in a later step.
  users: defineTable({
    email: v.string(),
    displayName: v.optional(v.string()),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("plus"),
      v.literal("pro"),
    ),
    aiUsageThisPeriod: v.number(),
    acceptedTermsVersion: v.optional(v.string()),
    acceptedTermsAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  people: defineTable({
    userId: v.string(),
    name: v.string(),
    nickname: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    relationship: v.optional(v.string()),
    interests: v.array(v.string()),
    // `notes` will be field-level encrypted before external testing
    // (PRD §10, v0.3). For now it's plain text.
    notes: v.optional(v.string()),
    // Birth date stores month + day only; year is normalized to a
    // 2000 sentinel at save time so the actual birth year is never
    // collected. Display logic (formatBirthMonthDay) ignores the
    // year. The form uses a custom MonthDayPicker that doesn't
    // expose a year selector at all.
    dateOfBirth: v.optional(v.number()),
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
  }).index("by_user", ["userId"]),

  giftIdeas: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
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
