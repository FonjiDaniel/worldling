import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger, isEventName, type LogEntry, maskEmail, REDACTED, redact } from "./logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("redact", () => {
  it("redacts secret-named keys at any depth", () => {
    const input = {
      password: "hunter2",
      smtp: { apiKey: "re_123", nested: [{ Authorization: "Bearer x", refreshToken: "t" }] },
      clientSecret: "s",
      code: "12345678",
      otpCode: "87654321",
      worldId: "w1",
    };
    expect(redact(input)).toEqual({
      password: REDACTED,
      smtp: { apiKey: REDACTED, nested: [{ Authorization: REDACTED, refreshToken: REDACTED }] },
      clientSecret: REDACTED,
      code: REDACTED,
      otpCode: REDACTED,
      worldId: "w1",
    });
  });

  it("masks emails in values", () => {
    expect(redact({ to: "kai@gmail.com", list: ["a.b@x.io"] })).toEqual({
      to: "k***@gmail.com",
      list: ["a***@x.io"],
    });
    expect(maskEmail("not an email, a@b")).toBe("not an email, a@b");
    expect(maskEmail("send to kai@gmail.com, <a.b@x.io> failed")).toBe(
      "send to k***@gmail.com, <a***@x.io> failed",
    );
  });

  it("reduces errors to name and message", () => {
    expect(redact({ error: new TypeError("bad kai@gmail.com") })).toEqual({
      error: { name: "TypeError", message: "bad k***@gmail.com" },
    });
  });

  it("caps depth", () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } };
    expect(JSON.stringify(redact(deep))).toContain("[truncated]");
  });

  it("does not mutate the input", () => {
    const input = { password: "x" };
    redact(input);
    expect(input.password).toBe("x");
  });
});

describe("createLogger", () => {
  it("emits one JSON line with the envelope and redacted fields", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const log = createLogger({ rid: "r1", fn: "comets:send", uid: "u1" });
    log.info("comet.sent", { cometId: "c1", token: "t", rid: "spoof" });
    expect(info).toHaveBeenCalledOnce();
    const line = JSON.parse(String(info.mock.calls[0]?.[0])) as LogEntry;
    expect(line).toMatchObject({
      level: "info",
      event: "comet.sent",
      rid: "r1",
      fn: "comets:send",
      uid: "u1",
      cometId: "c1",
      token: REDACTED,
    });
    expect(typeof line.ts).toBe("number");
  });

  it("routes levels and sends only warn and error to the sink", () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const sink = vi.fn<(entry: LogEntry) => void>();
    const log = createLogger({ rid: "r1", fn: "jobs:x", sink });
    log.info("jobs.bloom.started");
    log.warn("email.dispatch.retry", { password: "p" });
    log.error("jobs.bloom.failed");
    expect(warn).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
    expect(sink.mock.calls.map(([entry]) => entry.event)).toEqual([
      "email.dispatch.retry",
      "jobs.bloom.failed",
    ]);
    expect(sink.mock.calls[0]?.[0]).toMatchObject({ password: REDACTED });
  });
});

describe("event names", () => {
  it("accepts domain.action[.outcome]", () => {
    expect(isEventName("comet.sent")).toBe(true);
    expect(isEventName("email.dispatch.retry")).toBe(true);
    expect(isEventName("Comet.Sent")).toBe(false);
    expect(isEventName("sent")).toBe(false);
  });

  it("lists only valid names in docs/events.md", () => {
    const doc = readFileSync(new URL("../../docs/events.md", import.meta.url), "utf8");
    const names = [...doc.matchAll(/^\| `([^`]+)`\s+\|/gm)].map((match) => match[1] ?? "");
    expect(names).toContain("settings.read.invalid");
    for (const name of names) expect(isEventName(name), name).toBe(true);
  });
});
