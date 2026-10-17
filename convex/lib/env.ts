/** Every environment variable the Convex deployment reads (SPEC §13.5). */
export const CONVEX_ENV_NAMES = [
  "APP_ENV",
  "SITE_URL",
  "JWT_PRIVATE_KEY",
  "JWKS",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_EMAIL_HOOK_SECRET",
  "SECRETS_ENCRYPTION_KEY",
  "EMAIL_LINK_SECRET",
  "EMAIL_FALLBACK_TRANSPORT",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "EMAIL_FROM_NAME",
  "EMAIL_FROM_ADDRESS",
  "RESEND_API_KEY",
] as const;

export type ConvexEnvName = (typeof CONVEX_ENV_NAMES)[number];

export const APP_ENVS = ["development", "preview", "production", "test"] as const;

export type AppEnv = (typeof APP_ENVS)[number];

/** Returns the variable, or undefined when it is unset or empty. */
export function optionalEnv(name: ConvexEnvName): string | undefined {
  const value = process.env[name];
  return value === undefined || value === "" ? undefined : value;
}

/** Returns the variable or throws `MISSING_ENV: NAME`. Never includes the value in errors. */
export function requireEnv(name: ConvexEnvName): string {
  const value = optionalEnv(name);
  if (value === undefined) {
    throw new Error(`MISSING_ENV: ${name}`);
  }
  return value;
}

/** Env var holding encryption key `version` (SPEC §7.6): v1 is unsuffixed, v2+ is `_V{n}`. */
export function secretsKeyEnvName(version: number): string {
  return version === 1 ? "SECRETS_ENCRYPTION_KEY" : `SECRETS_ENCRYPTION_KEY_V${version}`;
}

/** Encryption key `version`, or undefined when it is unset or empty. */
export function secretsKeyEnv(version: number): string | undefined {
  const value = process.env[secretsKeyEnvName(version)];
  return value === undefined || value === "" ? undefined : value;
}

/** The deployment's APP_ENV, validated against the allowed values. */
export function appEnv(): AppEnv {
  const value = requireEnv("APP_ENV");
  const match = APP_ENVS.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new Error("INVALID_ENV: APP_ENV");
  }
  return match;
}
