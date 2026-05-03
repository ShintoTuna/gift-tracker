import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// Top of every UTC hour. The action filters users to those whose
// preferred local hour matches the current UTC hour mapped through
// their timezone, so a Tokyo "9am" reminder lands at 00:00 UTC.
crons.cron(
  "push notification fan-out",
  "0 * * * *",
  internal.notifications.runHourlyTick,
  {},
);

// Daily at 04:00 UTC — off-peak, off the top-of-hour push fan-out.
// Sweeps expired Convex Auth rows (`authSessions` + their refresh
// tokens, `authVerificationCodes`, stale `authVerifiers`). The library
// itself doesn't clean these up — see authCleanup.ts for the why.
crons.cron(
  "auth cleanup sweep",
  "0 4 * * *",
  internal.authCleanup.runSweep,
  {},
);

export default crons;
