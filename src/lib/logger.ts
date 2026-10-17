// Client error reporting (SPEC §10.4). Console for now; Sentry plugs in here in its phase.

export interface ErrorContext {
  fn?: string;
  rid?: string;
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  console.error("[worldling]", context, error);
}
