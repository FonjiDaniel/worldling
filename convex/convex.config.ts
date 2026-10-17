import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import shardedCounter from "@convex-dev/sharded-counter/convex.config";
import workpool from "@convex-dev/workpool/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();

app.use(rateLimiter);
app.use(workpool, { name: "emailWorkpool" });
app.use(shardedCounter);

export default app;
