# Log events

Every `ctx.log` event name (SPEC §10.3). Format: `domain.action[.outcome]`, lowercase, dot separated. Add a row when you add an event. A test checks every name here against the format.

Fields named like `password`, `secret`, `token`, `apiKey`, `authorization` or `code` are redacted, so put error codes under `errorCode`.

| Event                        | Level | Where                                                 | Fields               |
| ---------------------------- | ----- | ----------------------------------------------------- | -------------------- |
| `settings.read.invalid`      | warn  | `lib/settings.ts` `getSetting`                        | `key`                |
| `system_events.flush.failed` | error | `lib/functions.ts` `internalJobAction` (console only) | `error` (error name) |
