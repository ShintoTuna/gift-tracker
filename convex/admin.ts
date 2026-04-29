import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";

// GDPR third-party deletion handling. None of this is callable from
// the client — the admin runs each step from the Convex dashboard
// after receiving an email at privacy@giftsmith.app.
//
// Flow:
//   1. recordRequest      — log the inbound request (status: pending).
//   2. previewMatches     — list candidate people rows by name across
//                           every user. Admin reviews before deleting.
//   3. executeRedaction   — cascade-delete the chosen people rows,
//                           mark the request completed.
//   4. markRejected       — close the request without redaction (e.g.
//                           verification failed, requester wasn't the
//                           subject, etc.).

export const recordRequest = internalMutation({
  args: {
    requesterEmail: v.string(),
    subjectInfo: v.string(),
  },
  handler: async (ctx, { requesterEmail, subjectInfo }) => {
    return await ctx.db.insert("thirdPartyDeletionRequests", {
      requesterEmail,
      subjectInfo,
      status: "pending",
      receivedAt: Date.now(),
    });
  },
});

// Returns candidate people rows that match `name` (case-insensitive
// substring). Admin combines this with the request's `subjectInfo`
// to pick exactly which rows to redact. Capped to keep the dashboard
// preview readable.
export const previewMatches = internalQuery({
  args: {
    name: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { name, limit }) => {
    const needle = name.trim().toLowerCase();
    if (needle.length === 0) return [];
    const cap = limit ?? 50;
    // Full-table scan is acceptable here: this is admin-driven, runs
    // rarely, and the substring search across all users' people has
    // no useful index. Cap with `.take()` so even a malformed query
    // can't run away.
    const rows = await ctx.db.query("people").take(2000);
    const matches = rows.filter((p) => {
      const hay = `${p.name} ${p.nickname ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
    return matches.slice(0, cap).map((p) => ({
      _id: p._id,
      userId: p.userId,
      name: p.name,
      nickname: p.nickname,
      relationship: p.relationship,
    }));
  },
});

// Cascade-deletes each chosen person row using the same pattern as
// `convex/people.ts:remove` (occasions cascade; gift ideas are
// untagged but kept — they belong to the user, not the subject).
// Closes the request out and stamps an audit count.
export const executeRedaction = internalMutation({
  args: {
    requestId: v.id("thirdPartyDeletionRequests"),
    peopleIds: v.array(v.id("people")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, peopleIds, notes }) => {
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.status === "completed" || request.status === "rejected") {
      throw new Error(`Request already ${request.status}`);
    }

    let redacted = 0;
    for (const personId of peopleIds) {
      const person = await ctx.db.get(personId);
      if (!person) continue;

      const occasions = await ctx.db
        .query("occasions")
        .withIndex("by_person", (q) => q.eq("personId", personId))
        .collect();
      for (const o of occasions) await ctx.db.delete(o._id);

      const userIdeas = await ctx.db
        .query("giftIdeas")
        .withIndex("by_user", (q) =>
          q.eq("userId", person.userId as Id<"users">),
        )
        .collect();
      for (const idea of userIdeas) {
        if (idea.taggedPeople.includes(personId)) {
          await ctx.db.patch(idea._id, {
            taggedPeople: idea.taggedPeople.filter((p) => p !== personId),
            updatedAt: Date.now(),
          });
        }
      }

      if (person.photoStorageId) {
        await ctx.storage.delete(person.photoStorageId);
      }
      await ctx.db.delete(personId);
      redacted += 1;
    }

    await ctx.db.patch(requestId, {
      status: "completed",
      handledAt: Date.now(),
      handlerNotes: notes,
      redactedPeopleCount: redacted,
    });

    return { redacted };
  },
});

export const markRejected = internalMutation({
  args: {
    requestId: v.id("thirdPartyDeletionRequests"),
    notes: v.string(),
  },
  handler: async (ctx, { requestId, notes }) => {
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    await ctx.db.patch(requestId, {
      status: "rejected",
      handledAt: Date.now(),
      handlerNotes: notes,
    });
  },
});

export const listRequests = internalQuery({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("rejected"),
      ),
    ),
  },
  handler: async (ctx, { status }) => {
    const q = status
      ? ctx.db
          .query("thirdPartyDeletionRequests")
          .withIndex("by_status", (idx) => idx.eq("status", status))
      : ctx.db.query("thirdPartyDeletionRequests");
    return await q.order("desc").take(100);
  },
});
