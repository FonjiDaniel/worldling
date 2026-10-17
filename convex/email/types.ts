import type { Id } from "../_generated/dataModel";

// Shapes shared by the dispatcher, test send and providers. A ResolvedConfig holds decrypted
// secrets, so it only ever exists in memory inside an action.

export type TransportKind = "smtp" | "resend";

export interface SmtpTransport {
  kind: "smtp";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

export interface ResendTransport {
  kind: "resend";
  apiKey: string;
}

export interface ResolvedConfig {
  source: "db" | "env";
  configId?: Id<"emailConfigs">;
  fromName: string;
  fromAddress: string;
  replyTo?: string;
  transport: SmtpTransport | ResendTransport;
}

export interface OutgoingEmail {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  /** Stable per message, so a provider that supports it can drop duplicate sends. */
  idempotencyKey?: string;
}

/** SPEC §7.3. Adding a provider is one class and one TransportKind value. */
export interface EmailProvider {
  readonly name: TransportKind | "fake";
  send(message: OutgoingEmail): Promise<{ messageId: string }>;
}

/** `"Worldling" <hi@worldling.app>`, with quotes and line breaks removed from the name. */
export function formatFrom(name: string, address: string): string {
  const safe = name.replace(/["\r\n\\]/g, "").trim();
  return safe === "" ? address : `"${safe}" <${address}>`;
}
