import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import schema from "./schema";
import { modules } from "./test.setup";

describe("convex-test harness", () => {
  it("boots against the schema and runs a transaction", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });
});
