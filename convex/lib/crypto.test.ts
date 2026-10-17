import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { decryptSecret, encryptSecret, latestKeyVersion } from "./crypto";

const KEY_V1 = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, i) => i)));
const KEY_V2 = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, i) => 255 - i)));
const SECRET = "smtp-app-password-1234";

beforeEach(() => {
  vi.stubEnv("SECRETS_ENCRYPTION_KEY", KEY_V1);
  vi.stubEnv("SECRETS_ENCRYPTION_KEY_V2", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("encryptSecret / decryptSecret", () => {
  it("round trips and never stores the plaintext", async () => {
    const stored = await encryptSecret(SECRET);
    expect(stored.kv).toBe(1);
    expect(stored.last4).toBe("1234");
    expect(JSON.stringify(stored)).not.toContain("smtp-app-password");
    expect(await decryptSecret(stored)).toBe(SECRET);
  });

  it("uses a fresh IV for every write", async () => {
    const a = await encryptSecret(SECRET);
    const b = await encryptSecret(SECRET);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ct).not.toBe(b.ct);
  });

  it("gives no hint for short secrets", async () => {
    expect((await encryptSecret("short")).last4).toBe("");
  });

  it("rejects tampered ciphertext", async () => {
    const stored = await encryptSecret(SECRET);
    const bytes = Uint8Array.from(atob(stored.ct), (c) => c.charCodeAt(0));
    bytes[0] = (bytes[0] ?? 0) ^ 1;
    const tampered = { ...stored, ct: btoa(String.fromCharCode(...bytes)) };
    await expect(decryptSecret(tampered)).rejects.toThrow("DECRYPT_FAILED");
  });
});

describe("key versions", () => {
  it("writes with the latest key and still reads older rows", async () => {
    const old = await encryptSecret(SECRET);
    vi.stubEnv("SECRETS_ENCRYPTION_KEY_V2", KEY_V2);
    expect(latestKeyVersion()).toBe(2);
    const fresh = await encryptSecret(SECRET);
    expect(fresh.kv).toBe(2);
    expect(await decryptSecret(old)).toBe(SECRET);
    expect(await decryptSecret(fresh)).toBe(SECRET);
  });

  it("fails when the row's key version is gone", async () => {
    vi.stubEnv("SECRETS_ENCRYPTION_KEY_V2", KEY_V2);
    const stored = await encryptSecret(SECRET);
    vi.stubEnv("SECRETS_ENCRYPTION_KEY_V2", undefined);
    await expect(decryptSecret(stored)).rejects.toThrow("MISSING_ENV: SECRETS_ENCRYPTION_KEY_V2");
  });
});

describe("key errors", () => {
  it("names the missing variable", async () => {
    vi.stubEnv("SECRETS_ENCRYPTION_KEY", undefined);
    await expect(encryptSecret(SECRET)).rejects.toThrow("MISSING_ENV: SECRETS_ENCRYPTION_KEY");
  });

  it("rejects a key that is not 32 bytes without echoing it", async () => {
    const badKey = btoa("too-short-key-value");
    vi.stubEnv("SECRETS_ENCRYPTION_KEY", badKey);
    const error: unknown = await encryptSecret(SECRET).catch((e: unknown) => e);
    expect(String(error)).toContain("INVALID_ENV: SECRETS_ENCRYPTION_KEY");
    expect(String(error)).not.toContain(badKey);
  });

  it("rejects a key that is not base64", async () => {
    vi.stubEnv("SECRETS_ENCRYPTION_KEY", "not base64 !!");
    await expect(encryptSecret(SECRET)).rejects.toThrow("INVALID_ENV: SECRETS_ENCRYPTION_KEY");
  });
});
