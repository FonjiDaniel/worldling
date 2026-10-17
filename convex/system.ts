import { v } from "convex/values";

import { publicQuery } from "./lib/functions";
import { getSetting } from "./lib/settings";

/** App-wide state the client needs before anything else, e.g. the maintenance screen. */
export const status = publicQuery({
  args: {},
  returns: v.object({ maintenance: v.object({ enabled: v.boolean(), message: v.string() }) }),
  handler: async (ctx) => ({ maintenance: await getSetting(ctx, "maintenance") }),
});
