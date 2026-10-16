import { defineApp } from "convex/server";

// Components (rateLimiter, workpool, shardedCounter) are registered here with app.use() in Phase 2.
const app = defineApp();

export default app;
