// AES-256-GCM for secrets at rest (SPEC §7.6). Web Crypto only, so it runs in any Convex runtime.
// Key v1 is SECRETS_ENCRYPTION_KEY, v2+ is SECRETS_ENCRYPTION_KEY_V{n}. New writes use the latest.

import { secretsKeyEnv, secretsKeyEnvName } from "./env";

export interface EncryptedSecret {
  iv: string; // base64, 12 bytes
  ct: string; // base64 ciphertext + GCM tag
  kv: number; // key version
  last4: string; // display hint, empty for short secrets
}

const MAX_KEY_VERSION = 9;
const KEY_BYTES = 32;
const IV_BYTES = 12;
const MIN_LENGTH_FOR_HINT = 12;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** The highest key version that is configured. */
export function latestKeyVersion(): number {
  for (let version = MAX_KEY_VERSION; version >= 1; version--) {
    if (secretsKeyEnv(version) !== undefined) return version;
  }
  throw new Error(`MISSING_ENV: ${secretsKeyEnvName(1)}`);
}

async function importKey(version: number): Promise<CryptoKey> {
  const name = secretsKeyEnvName(version);
  const encoded = secretsKeyEnv(version);
  if (encoded === undefined) throw new Error(`MISSING_ENV: ${name}`);
  let raw: Uint8Array<ArrayBuffer>;
  try {
    raw = fromBase64(encoded);
  } catch {
    throw new Error(`INVALID_ENV: ${name}`);
  }
  if (raw.length !== KEY_BYTES) throw new Error(`INVALID_ENV: ${name}`);
  return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(plaintext: string): Promise<EncryptedSecret> {
  const kv = latestKeyVersion();
  const key = await importKey(kv);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  const last4 = plaintext.length >= MIN_LENGTH_FOR_HINT ? plaintext.slice(-4) : "";
  return { iv: toBase64(iv), ct: toBase64(ct), kv, last4 };
}

/** Decrypts with the key matching `kv`. Throws a generic error on tampering or a wrong key. */
export async function decryptSecret(secret: EncryptedSecret): Promise<string> {
  const key = await importKey(secret.kv);
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(secret.iv) },
      key,
      fromBase64(secret.ct),
    );
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error("DECRYPT_FAILED");
  }
}
