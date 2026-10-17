// The email waiting for a code, kept per tab so a refresh on /verify keeps working.
// Never the password. Storage can be unavailable (private mode), so every access is guarded.

const KEY = "worldling:auth-flow:v1";

export interface PendingFlow {
  email: string;
  /** Where to go once the code is accepted. */
  next: string;
}

export function savePendingFlow(flow: PendingFlow): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(flow));
  } catch {
    // Without storage the verify page asks for the email again.
  }
}

/** The stored JSON, as a stable snapshot for useSyncExternalStore. */
export function pendingFlowSnapshot(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function parsePendingFlow(raw: string | null): PendingFlow | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "email" in value &&
      "next" in value &&
      typeof value.email === "string" &&
      typeof value.next === "string"
    ) {
      return { email: value.email, next: value.next };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingFlow(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Same normalization as the server (convex/auth.ts), so the code matches the account. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
