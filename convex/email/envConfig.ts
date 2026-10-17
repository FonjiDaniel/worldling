import { optionalEnv } from "../lib/env";
import type { ResolvedConfig } from "./types";

// Env fallback (SPEC §7.5, ADR-008), used when no config is active in the database.

const DEFAULT_FROM_NAME = "Worldling";

/** The env transport, or null when EMAIL_FALLBACK_TRANSPORT or its variables are missing. */
export function envEmailConfig(): ResolvedConfig | null {
  const fromAddress = optionalEnv("EMAIL_FROM_ADDRESS");
  if (fromAddress === undefined) return null;
  const base = {
    source: "env" as const,
    fromName: optionalEnv("EMAIL_FROM_NAME") ?? DEFAULT_FROM_NAME,
    fromAddress,
  };

  const kind = optionalEnv("EMAIL_FALLBACK_TRANSPORT");
  if (kind === "resend") {
    const apiKey = optionalEnv("RESEND_API_KEY");
    return apiKey === undefined ? null : { ...base, transport: { kind: "resend", apiKey } };
  }
  if (kind !== "smtp") return null;

  const host = optionalEnv("SMTP_HOST");
  const user = optionalEnv("SMTP_USER");
  const password = optionalEnv("SMTP_PASSWORD");
  const port = Number(optionalEnv("SMTP_PORT") ?? "465");
  if (host === undefined || user === undefined || password === undefined) return null;
  if (!Number.isInteger(port) || port <= 0) return null;
  const secure = (optionalEnv("SMTP_SECURE") ?? String(port === 465)) === "true";
  return { ...base, transport: { kind: "smtp", host, port, secure, user, password } };
}

/** Which transport the env fallback would use, without reading any secret. */
export function envTransportSummary(): { transport: string; host?: string } | null {
  const kind = optionalEnv("EMAIL_FALLBACK_TRANSPORT");
  if (kind !== "smtp" && kind !== "resend") return null;
  const host = kind === "smtp" ? optionalEnv("SMTP_HOST") : undefined;
  return host === undefined ? { transport: kind } : { transport: kind, host };
}

/** EMAIL_FAKE routes mail to the fake provider. Ignored in production, so it can't eat real mail. */
export function isFakeEmail(): boolean {
  return optionalEnv("EMAIL_FAKE") === "true" && optionalEnv("APP_ENV") !== "production";
}
