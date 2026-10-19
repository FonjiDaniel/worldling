import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

// Scheduled jobs (SPEC §5.6). Each writes a jobRuns row.

const crons = cronJobs();

crons.interval("jobs.bloomProcessor", { minutes: 1 }, internal.jobs.bloom.bloomProcessor, {});

export default crons;
