import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import { makeTest, setMaintenance } from "./test.helpers";

describe("system.status", () => {
  it("reports maintenance to anyone, signed in or not", async () => {
    const t = makeTest();
    expect(await t.query(api.system.status, {})).toEqual({
      maintenance: { enabled: false, message: "" },
    });
    await setMaintenance(t, true);
    expect((await t.query(api.system.status, {})).maintenance.enabled).toBe(true);
  });
});
