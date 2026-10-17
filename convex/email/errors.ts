// Send failure classification (SPEC §7.2, ADR-014). Retryable failures go back to the workpool,
// permanent ones fail the outbox row at once. Reasons are short codes, never provider text,
// because provider messages can echo addresses or credentials.

export type SendFailureKind = "retryable" | "permanent";

export interface SendFailure {
  kind: SendFailureKind;
  reason: string;
}

export class EmailSendError extends Error {
  readonly kind: SendFailureKind;
  readonly reason: string;

  constructor(kind: SendFailureKind, reason: string) {
    super(`${kind}:${reason}`);
    this.name = "EmailSendError";
    this.kind = kind;
    this.reason = reason;
  }
}

const RETRYABLE_CODES = new Set([
  "ECONNECTION",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ESOCKET",
  "EDNS",
  "EPIPE",
  "EAI_AGAIN",
]);
const PERMANENT_CODES = new Set(["EAUTH", "ENOAUTH", "EENVELOPE", "EMESSAGE", "ETLS"]);

function field(error: object, key: string): unknown {
  return Reflect.get(error, key);
}

/** Classifies an HTTP status from an API provider: 429 and 5xx retry, other 4xx are permanent. */
export function classifyHttpStatus(status: number): SendFailure {
  const kind = status === 429 || status >= 500 ? "retryable" : "permanent";
  return { kind, reason: `http_${status}` };
}

/** Classifies any send error. SMTP 4xx replies are transient by definition, 5xx are final. */
export function classifySendError(error: unknown): SendFailure {
  if (error instanceof EmailSendError) return { kind: error.kind, reason: error.reason };
  if (typeof error !== "object" || error === null) return { kind: "retryable", reason: "unknown" };

  const code = field(error, "code");
  if (typeof code === "string" && PERMANENT_CODES.has(code)) {
    return { kind: "permanent", reason: `smtp_${code.slice(1).toLowerCase()}` };
  }
  const responseCode = field(error, "responseCode");
  if (typeof responseCode === "number" && responseCode >= 400 && responseCode < 600) {
    return {
      kind: responseCode < 500 ? "retryable" : "permanent",
      reason: `smtp_${responseCode}`,
    };
  }
  if (typeof code === "string" && RETRYABLE_CODES.has(code)) {
    return { kind: "retryable", reason: `network_${code.toLowerCase()}` };
  }
  // fetch() network failures surface as TypeError.
  if (error instanceof TypeError) return { kind: "retryable", reason: "network" };
  return { kind: "retryable", reason: "unknown" };
}
