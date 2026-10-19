import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

// Scheduled jobs (SPEC §5.6). Each writes a jobRuns row.

const crons = cronJobs();

crons.interval("jobs.bloomProcessor", { minutes: 1 }, internal.jobs.bloom.bloomProcessor, {});
crons.interval("jobs.rollups.trending", { hours: 1 }, internal.jobs.rollups.trending, {});

export default crons;
