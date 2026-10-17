"use node";

import { classifyHttpStatus, EmailSendError } from "./errors";
import type {
  EmailProvider,
  OutgoingEmail,
  ResendTransport,
  ResolvedConfig,
  SmtpTransport,
} from "./types";
import { isE2eRecipient, isFakeEmail } from "./envConfig";

// Provider adapters (SPEC §7.3). Secrets arrive decrypted and stay in this process.

const SMTP_TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };
const RESEND_URL = "https://api.resend.com/emails";

export class SmtpProvider implements EmailProvider {
  readonly name = "smtp";

  constructor(private readonly transport: SmtpTransport) {}

  async send(message: OutgoingEmail): Promise<{ messageId: string }> {
    // Loaded on first use, so tests on the fake provider never import Node networking.
    const nodemailer = await import("nodemailer");
    const { host, port, secure, user, password } = this.transport;
    const client = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: password },
      ...SMTP_TIMEOUTS,
    });
    try {
      const info = await client.sendMail({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo !== undefined && { replyTo: message.replyTo }),
        ...(message.headers !== undefined && { headers: message.headers }),
      });
      return { messageId: info.messageId };
    } finally {
      client.close();
    }
  }
}

export class ResendProvider implements EmailProvider {
  readonly name = "resend";

  constructor(private readonly transport: ResendTransport) {}

  async send(message: OutgoingEmail): Promise<{ messageId: string }> {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.transport.apiKey}`,
        "Content-Type": "application/json",
        ...(message.idempotencyKey !== undefined && { "Idempotency-Key": message.idempotencyKey }),
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo !== undefined && { reply_to: message.replyTo }),
        ...(message.headers !== undefined && { headers: message.headers }),
      }),
    });
    if (!response.ok) {
      const failure = classifyHttpStatus(response.status);
      throw new EmailSendError(failure.kind, failure.reason);
    }
    const body: unknown = await response.json();
    const id: unknown =
      typeof body === "object" && body !== null ? Reflect.get(body, "id") : undefined;
    if (typeof id !== "string") throw new EmailSendError("retryable", "resend_bad_response");
    return { messageId: id };
  }
}

/**
 * EMAIL_FAKE=true. Sends nothing. Recipients starting with `fail-permanent` or `fail-retry`
 * fail that way, so tests can drive every dispatch path.
 */
export class FakeProvider implements EmailProvider {
  readonly name = "fake";

  send(message: OutgoingEmail): Promise<{ messageId: string }> {
    if (message.to.startsWith("fail-permanent")) {
      return Promise.reject(new EmailSendError("permanent", "fake_permanent"));
    }
    if (message.to.startsWith("fail-retry")) {
      return Promise.reject(new EmailSendError("retryable", "fake_retry"));
    }
    return Promise.resolve({ messageId: `fake-${crypto.randomUUID()}` });
  }
}

/** The provider for one message. The fake one for EMAIL_FAKE and e2e recipients (ADR-016). */
export function createProvider(config: ResolvedConfig, to?: string): EmailProvider {
  if (isFakeEmail() || (to !== undefined && isE2eRecipient(to))) return new FakeProvider();
  return config.transport.kind === "smtp"
    ? new SmtpProvider(config.transport)
    : new ResendProvider(config.transport);
}
