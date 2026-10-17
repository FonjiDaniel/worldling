// Structured JSON logging (SPEC §10.3). One line per call, secrets redacted, emails masked.

export type LogLevel = "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

export interface LogEntry {
  level: LogLevel;
  event: string;
  ts: number;
  rid: string;
  fn: string;
  uid?: string;
  [field: string]: unknown;
}

export interface Logger {
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

export interface LoggerOptions {
  rid: string;
  fn: string;
  uid?: string;
  /** Receives warn and error entries, e.g. to persist them from actions. */
  sink?: (entry: LogEntry) => void;
}

export const REDACTED = "[redacted]";
const SECRET_KEY = /password|secret|token|apiKey|authorization|code/i;
// Matches emails anywhere in a string, so "send to kai@gmail.com failed" is masked too.
const EMAIL = /([^\s@<>()[\],;:"'])[^\s@<>()[\],;:"']*(@[^\s@<>()[\],;:"']+\.[a-z]{2,})/gi;
const EVENT_NAME = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,3}$/;
const MAX_DEPTH = 6;
const RESERVED = new Set(["level", "event", "ts", "rid", "fn", "uid"]);

/** Masks every email in `value`: `kai@gmail.com` -> `k***@gmail.com`. */
export function maskEmail(value: string): string {
  return value.replace(EMAIL, "$1***$2");
}

/** Deep copy with secret keys replaced, emails masked and errors reduced to name + message. */
export function redact(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return maskEmail(value);
  if (value === null || typeof value !== "object") return value;
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (value instanceof Error) {
    return { name: value.name, message: maskEmail(value.message) };
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SECRET_KEY.test(key) ? REDACTED : redact(item, depth + 1);
  }
  return out;
}

export function isEventName(event: string): boolean {
  return EVENT_NAME.test(event);
}

function emit(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.info(line);
}

export function createLogger(options: LoggerOptions): Logger {
  const write = (level: LogLevel, event: string, fields: LogFields = {}) => {
    const safe = redact(fields) as LogFields;
    const entry: LogEntry = { level, event, ts: Date.now(), rid: options.rid, fn: options.fn };
    if (options.uid !== undefined) entry.uid = options.uid;
    for (const [key, item] of Object.entries(safe)) {
      if (!RESERVED.has(key)) entry[key] = item;
    }
    emit(entry);
    if (level !== "info") options.sink?.(entry);
  };
  return {
    info: (event, fields) => {
      write("info", event, fields);
    },
    warn: (event, fields) => {
      write("warn", event, fields);
    },
    error: (event, fields) => {
      write("error", event, fields);
    },
  };
}
