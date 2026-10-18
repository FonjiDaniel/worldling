// Client error reporting (SPEC §10.4). Console for now; Sentry plugs in here in its phase.

export interface ErrorContext {
  fn?: string;
  rid?: string;
  /** Searchable tags, like the 3D tier or GPU. Never secrets or user content. */
  tags?: Record<string, string | number>;
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  console.error("[worldling]", context, error);
}
