import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getCurrentUserId } from "./lib/auth";
import { getNextOccurrence } from "./lib/dates";
import {
  buildExpoMessage,
  chunk,
  normalizeLanguage,
  parseExpoTickets,
  postToExpo,
  renderPushBody,
  renderPushTitle,
} from "./lib/pushNotifications";

const MS_PER_DAY = 86_400_000;
const MAX_DAYS_AHEAD_ENTRIES = 10;
const MIN_DAYS_AHEAD = 1;
const MAX_DAYS_AHEAD = 365;

// ---------------------------------------------------------------------------
// Public surface — Settings screen + NotificationsRegistrar consume these.
// ---------------------------------------------------------------------------

// Returns the user's notification prefs flattened to a small object, or
// null when unauthenticated. Mirrors the null-when-unauthed shape used
// by `userSettings.get` so the LanguageGate-equivalent gate can call
// this safely pre-auth.
export const getNotificationPrefs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const row = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return {
      enabled: row?.notificationsEnabled ?? false,
      daysAhead: row?.notificationDaysAhead ?? [],
      timeOfDayMinutes: row?.notificationTimeOfDayMinutes ?? null,
      timezone: row?.notificationTimezone ?? null,
    };
  },
});

// Upsert prefs. All fields optional so the client can patch one at a
// time (toggle vs. days-ahead vs. time-of-day) without round-tripping
// the rest. Validation cap is enforced server-side; the client also
// guards before submitting so the user gets immediate feedback.
export const setNotificationPrefs = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    daysAhead: v.optional(v.array(v.number())),
    timeOfDayMinutes: v.optional(v.number()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    let cleanedDaysAhead: number[] | undefined;
    if (args.daysAhead !== undefined) {
      const cleaned = sanitizeDaysAhead(args.daysAhead);
      if (cleaned === null) {
        throw new Error("Invalid daysAhead");
      }
      cleanedDaysAhead = cleaned;
    }
    if (args.timeOfDayMinutes !== undefined) {
      const t = args.timeOfDayMinutes;
      if (!Number.isInteger(t) || t < 0 || t > 1439) {
        throw new Error("Invalid timeOfDayMinutes");
      }
    }

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const patch: Partial<Doc<"userSettings">> = {};
    if (args.enabled !== undefined) patch.notificationsEnabled = args.enabled;
    if (cleanedDaysAhead !== undefined) patch.notificationDaysAhead = cleanedDaysAhead;
    if (args.timeOfDayMinutes !== undefined)
      patch.notificationTimeOfDayMinutes = args.timeOfDayMinutes;
    if (args.timezone !== undefined) patch.notificationTimezone = args.timezone;

    if (existing === null) {
      await ctx.db.insert("userSettings", { userId, ...patch });
    } else {
      await ctx.db.patch(existing._id, patch);
    }
  },
});

// Idempotent registration. If the same token is already present for
// this user, no-op. If it's present for a different user (device
// signed into a different account), reassign by deleting the stale
// row and inserting fresh.
export const registerToken = mutation({
  args: {
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android")),
  },
  handler: async (ctx, { token, platform }) => {
    const userId = await getCurrentUserId(ctx);
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (existing !== null) {
      if (existing.userId === userId) return;
      await ctx.db.delete(existing._id);
    }
    await ctx.db.insert("pushTokens", {
      userId,
      token,
      platform,
      createdAt: Date.now(),
    });
  },
});

export const unregisterToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getCurrentUserId(ctx);
    const rows = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .collect();
    for (const r of rows) {
      if (r.userId === userId) await ctx.db.delete(r._id);
    }
  },
});

// ---------------------------------------------------------------------------
// Internal helpers — the cron action drives these.
// ---------------------------------------------------------------------------

type DueUser = {
  userId: string;
  daysAhead: number[];
  timezone: string;
  timeOfDayMinutes: number;
  language: string;
};

// Scans userSettings for opted-in users whose preferred local *hour*
// matches the cron's current UTC hour as seen in their tz. We compare
// hour granularity only — the cron runs at the top of each UTC hour,
// so "9am Tokyo" lands during the UTC hour that contains 09:00 Tokyo
// regardless of the chosen minute (e.g. 09:30 still fires at 09:00 UTC
// equivalent). Good-enough precision for "remind me in the morning".
//
// Full scan over userSettings — fine at launch scale. If the user base
// grows past a few hundred opted-in accounts, add an index on
// `notificationsEnabled` to cap reads.
export const _listUsersWithDuePrefs = internalQuery({
  args: { nowMs: v.number() },
  handler: async (ctx, { nowMs }): Promise<DueUser[]> => {
    const all = await ctx.db.query("userSettings").collect();
    const due: DueUser[] = [];
    for (const row of all) {
      if (row.notificationsEnabled !== true) continue;
      const daysAhead = row.notificationDaysAhead ?? [];
      if (daysAhead.length === 0) continue;
      const timeOfDayMinutes = row.notificationTimeOfDayMinutes ?? 9 * 60;
      const timezone = row.notificationTimezone ?? "UTC";
      const localHour = currentLocalHour(nowMs, timezone);
      if (localHour === null) continue;
      const userHour = Math.floor(timeOfDayMinutes / 60);
      if (localHour !== userHour) continue;
      due.push({
        userId: row.userId,
        daysAhead,
        timezone,
        timeOfDayMinutes,
        language: row.preferredLanguage ?? "en",
      });
    }
    return due;
  },
});

type DueReminder = {
  occasionId: Id<"occasions">;
  occurrenceDate: number;
  personName: string;
  occasionTitle: string;
};

// Finds occasions whose next occurrence falls exactly `daysAhead` UTC
// days after today's UTC midnight. UTC days are sufficient because
// `getNextOccurrence` projects yearly recurrences to UTC midnight, and
// one-off dates we round down to their UTC midnight before comparing.
export const _findDueRemindersForUser = internalQuery({
  args: { userId: v.string(), daysAhead: v.number(), nowMs: v.number() },
  handler: async (ctx, { userId, daysAhead, nowMs }): Promise<DueReminder[]> => {
    const todayUtc = Math.floor(nowMs / MS_PER_DAY) * MS_PER_DAY;
    const target = todayUtc + daysAhead * MS_PER_DAY;

    const people = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(500);

    const reminders: DueReminder[] = [];
    for (const person of people) {
      const occasions = await ctx.db
        .query("occasions")
        .withIndex("by_person", (q) => q.eq("personId", person._id))
        .take(100);
      for (const occ of occasions) {
        const next = getNextOccurrence(occ, nowMs);
        if (next === null) continue;
        const occUtcMidnight = Math.floor(next / MS_PER_DAY) * MS_PER_DAY;
        if (occUtcMidnight !== target) continue;
        const dup = await ctx.db
          .query("notificationLog")
          .withIndex("by_user_occasion", (q) =>
            q
              .eq("userId", userId)
              .eq("occasionId", occ._id)
              .eq("occurrenceDate", target)
              .eq("daysAhead", daysAhead),
          )
          .first();
        if (dup !== null) continue;
        reminders.push({
          occasionId: occ._id,
          occurrenceDate: target,
          personName: person.name,
          occasionTitle: occ.title,
        });
      }
    }
    return reminders;
  },
});

export const _listTokensForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const _deleteTokenByValue = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const rows = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
  },
});

export const _recordSent = internalMutation({
  args: {
    userId: v.string(),
    occasionId: v.id("occasions"),
    occurrenceDate: v.number(),
    daysAhead: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notificationLog", { ...args, sentAt: Date.now() });
  },
});

// ---------------------------------------------------------------------------
// Cron orchestrator — POSTs to Expo Push API, prunes invalid tokens.
// ---------------------------------------------------------------------------

export const runHourlyTick = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const now = Date.now();
    const dueUsers: DueUser[] = await ctx.runQuery(
      internal.notifications._listUsersWithDuePrefs,
      { nowMs: now },
    );

    for (const user of dueUsers) {
      const tokens: Doc<"pushTokens">[] = await ctx.runQuery(
        internal.notifications._listTokensForUser,
        { userId: user.userId },
      );
      if (tokens.length === 0) continue;

      const language = normalizeLanguage(user.language);

      for (const days of user.daysAhead) {
        const reminders: DueReminder[] = await ctx.runQuery(
          internal.notifications._findDueRemindersForUser,
          { userId: user.userId, daysAhead: days, nowMs: now },
        );
        if (reminders.length === 0) continue;

        const messages = [];
        const tokenOrder: string[] = [];
        for (const rem of reminders) {
          const title = renderPushTitle(language, {
            personName: rem.personName,
            occasionTitle: rem.occasionTitle,
          });
          const body = renderPushBody(language, {
            personName: rem.personName,
            occasionTitle: rem.occasionTitle,
            daysAhead: days,
          });
          for (const t of tokens) {
            messages.push(
              buildExpoMessage({
                token: t.token,
                title,
                body,
                data: { occasionId: rem.occasionId, daysAhead: days },
              }),
            );
            tokenOrder.push(t.token);
          }
        }

        const batches = chunk(messages, 100);
        const tokenBatches = chunk(tokenOrder, 100);
        for (let i = 0; i < batches.length; i++) {
          try {
            const response = await postToExpo(batches[i]);
            const { deviceNotRegisteredTokens } = parseExpoTickets(
              response,
              tokenBatches[i],
            );
            for (const dead of deviceNotRegisteredTokens) {
              await ctx.runMutation(internal.notifications._deleteTokenByValue, {
                token: dead,
              });
            }
          } catch (err) {
            // Transient HTTP failure — skip recording, next tick will
            // retry naturally because the dedupe ledger is empty.
            console.error("Expo push batch failed", err);
            continue;
          }
        }

        // Record one ledger row per (occasion, daysAhead) regardless
        // of how many devices got the message. The dedupe key is per
        // user + occasion + occurrence + daysAhead.
        for (const rem of reminders) {
          await ctx.runMutation(internal.notifications._recordSent, {
            userId: user.userId,
            occasionId: rem.occasionId,
            occurrenceDate: rem.occurrenceDate,
            daysAhead: days,
          });
        }
      }
    }
  },
});

// ---------------------------------------------------------------------------
// Helpers — local
// ---------------------------------------------------------------------------

function currentLocalHour(nowMs: number, timeZone: string): number | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    });
    const parts = fmt.formatToParts(new Date(nowMs));
    const hourPart = parts.find((p) => p.type === "hour");
    if (!hourPart) return null;
    const hour = Number.parseInt(hourPart.value, 10);
    return Number.isFinite(hour) ? hour : null;
  } catch {
    return null;
  }
}

function sanitizeDaysAhead(input: number[]): number[] | null {
  if (input.length > MAX_DAYS_AHEAD_ENTRIES) return null;
  const seen = new Set<number>();
  const out: number[] = [];
  for (const raw of input) {
    if (!Number.isInteger(raw)) return null;
    if (raw < MIN_DAYS_AHEAD || raw > MAX_DAYS_AHEAD) return null;
    if (seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }
  out.sort((a, b) => a - b);
  return out;
}
