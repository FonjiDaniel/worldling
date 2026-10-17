import { describe, expect, it } from "vitest";

import { classifyHttpStatus, classifySendError, EmailSendError } from "./errors";

const smtpError = (fields: Record<string, unknown>) => Object.assign(new Error("smtp"), fields);

describe("classifySendError", () => {
  it.each([
    [smtpError({ code: "ETIMEDOUT" }), "retryable", "network_etimedout"],
    [smtpError({ code: "ECONNECTION" }), "retryable", "network_econnection"],
    [smtpError({ code: "ESOCKET" }), "retryable", "network_esocket"],
    [smtpError({ code: "EDNS" }), "retryable", "network_edns"],
    [smtpError({ code: "EAUTH", responseCode: 535 }), "permanent", "smtp_auth"],
    [smtpError({ code: "EENVELOPE", responseCode: 550 }), "permanent", "smtp_envelope"],
    [smtpError({ code: "EMESSAGE", responseCode: 421 }), "permanent", "smtp_message"],
    [smtpError({ responseCode: 421 }), "retryable", "smtp_421"],
    [smtpError({ responseCode: 451 }), "retryable", "smtp_451"],
    [smtpError({ responseCode: 554 }), "permanent", "smtp_554"],
    [new TypeError("fetch failed"), "retryable", "network"],
    [new Error("weird"), "retryable", "unknown"],
    ["not an error", "retryable", "unknown"],
    [new EmailSendError("permanent", "no_transport"), "permanent", "no_transport"],
  ])("%o is %s (%s)", (error, kind, reason) => {
    expect(classifySendError(error)).toEqual({ kind, reason });
  });

  it("never copies provider text into the reason", () => {
    const leaky = smtpError({ code: "EAUTH", response: "535 bad password for kai@gmail.com" });
    expect(JSON.stringify(classifySendError(leaky))).not.toContain("kai");
  });
});

describe("classifyHttpStatus", () => {
  it.each([
    [429, "retryable"],
    [500, "retryable"],
    [503, "retryable"],
    [400, "permanent"],
    [401, "permanent"],
    [403, "permanent"],
    [422, "permanent"],
  ])("%i is %s", (status, kind) => {
    expect(classifyHttpStatus(status)).toEqual({ kind, reason: `http_${status}` });
  });
});
