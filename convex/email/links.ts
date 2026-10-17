import { optionalEnv, requireEnv } from "../lib/env";
import { DAY_MS } from "../lib/time";
import type { SuppressionScope } from "../shared/emailTemplates";

// Signed email links (SPEC §7.8). Token = base64url(payload) "." base64url(HMAC-SHA256).
// The payload is { e: email, s: scope, x: expiry ms }. Web Crypto only, so any runtime works.

export const UNSUBSCRIBE_PATH = "/email/unsubscribe";
export const LINK_TTL_MS = 365 * DAY_MS;

const SCOPES = new Set<string>(["all_non_security", "digest", "comet_alerts", "product"]);
const encoder = new TextEncoder();

export interface LinkClaims {
  email: string;
  scope: SuppressionScope;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  let binary: string;
  try {
    binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = encoder.encode(requireEnv("EMAIL_LINK_SECRET"));
  return await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signLinkToken(claims: LinkClaims, now: number): Promise<string> {
  const payload = { e: claims.email, s: claims.scope, x: now + LINK_TTL_MS };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** The claims, or null when the token is malformed, tampered with or expired. */
export async function verifyLinkToken(token: string, now: number): Promise<LinkClaims | null> {
  const [body, signature, extra] = token.split(".");
  if (body === undefined || signature === undefined || extra !== undefined) return null;
  const signatureBytes = fromBase64Url(signature);
  const bodyBytes = fromBase64Url(body);
  if (signatureBytes === null || bodyBytes === null) return null;
  // crypto.subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(),
    signatureBytes,
    encoder.encode(body),
  );
  if (!valid) return null;
  return parseClaims(new TextDecoder().decode(bodyBytes), now);
}

function parseClaims(json: string, now: number): LinkClaims | null {
  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null) return null;
  const { e, s, x } = payload as Record<string, unknown>;
  if (typeof e !== "string" || typeof s !== "string" || typeof x !== "number") return null;
  if (!SCOPES.has(s) || x <= now) return null;
  return { email: e, scope: s as SuppressionScope };
}

/** Full unsubscribe URL on this deployment's HTTP actions origin. */
export async function unsubscribeUrl(claims: LinkClaims, now: number): Promise<string> {
  const origin = optionalEnv("CONVEX_SITE_URL") ?? requireEnv("SITE_URL");
  const token = await signLinkToken(claims, now);
  return `${origin.replace(/\/$/, "")}${UNSUBSCRIBE_PATH}?t=${encodeURIComponent(token)}`;
}
