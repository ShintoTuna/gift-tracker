import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

// Sweep expired Convex Auth artifacts. The library (`@convex-dev/auth`
// v0.0.91) stores `expirationTime` on each row but never deletes
// expired ones — see upstream issue
// https://github.com/get-convex/convex-auth/issues/30, still open. Until
// the maintainers ship that, a daily cron drives this mutation to keep
// `authSessions`, `authRefreshTokens`, `authVerificationCodes`, and
// `authVerifiers` from growing unbounded as users sign in / abandon
// flows / let sessions lapse.
//
// We scan with `.filter()` rather than `withIndex` because none of the
// library-defined tables index `expirationTime`. At MVP scale a daily
// scan over thousands of rows is fine; if it ever becomes hot, the
// remediation is to re-declare those tables in `schema.ts` (the library
// supports this — see `authTables.<name>.validator.fields`) with an
// index on `expirationTime` and switch to `withIndex` here.
const BATCH = 200;
const VERIFIER_TTL_MS = 60 * 60 * 1000; // OAuth flows complete in seconds; 1h is generous.

export const runSweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let needsAnotherPass = false;

    // 1. Expired sessions → cascade-delete their refresh tokens via the
    //    `sessionId` index, then drop the session row. Mirrors the
    //    cascade in `users.deleteAccount`.
    const expiredSessions = await ctx.db
      .query("authSessions")
      .filter((q) => q.lt(q.field("expirationTime"), now))
      .take(BATCH);
    for (const session of expiredSessions) {
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const t of tokens) await ctx.db.delete(t._id);
      await ctx.db.delete(session._id);
    }
    if (expiredSessions.length === BATCH) needsAnotherPass = true;

    // 2. Expired verification codes (OTP, OAuth, magic-link). One row
    //    per login *attempt*; abandoned flows leak rows with a short
    //    `expirationTime` (minutes) that nothing else cleans up.
    const expiredCodes = await ctx.db
      .query("authVerificationCodes")
      .filter((q) => q.lt(q.field("expirationTime"), now))
      .take(BATCH);
    for (const c of expiredCodes) await ctx.db.delete(c._id);
    if (expiredCodes.length === BATCH) needsAnotherPass = true;

    // 3. Stale PKCE verifiers — this table has no `expirationTime`, so
    //    fall back to `_creationTime`. A real OAuth flow finishes in
    //    seconds; anything older than VERIFIER_TTL_MS is dead.
    const verifierCutoff = now - VERIFIER_TTL_MS;
    const staleVerifiers = await ctx.db
      .query("authVerifiers")
      .filter((q) => q.lt(q.field("_creationTime"), verifierCutoff))
      .take(BATCH);
    for (const v of staleVerifiers) await ctx.db.delete(v._id);
    if (staleVerifiers.length === BATCH) needsAnotherPass = true;

    // If any pass hit BATCH, more rows are likely waiting. Re-enqueue
    // immediately so a single cron tick drains everything without
    // exceeding per-mutation transaction limits.
    if (needsAnotherPass) {
      await ctx.scheduler.runAfter(0, internal.authCleanup.runSweep, {});
    }

    return {
      sessionsDeleted: expiredSessions.length,
      codesDeleted: expiredCodes.length,
      verifiersDeleted: staleVerifiers.length,
      requeued: needsAnotherPass,
    };
  },
});
