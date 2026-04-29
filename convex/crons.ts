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

export default crons;
