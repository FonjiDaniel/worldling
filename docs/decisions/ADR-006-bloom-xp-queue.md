# ADR-006: Bloom XP via append-only queue

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §2.4, §5.6

## Decision

Bloom XP events go into an append-only queue that a cron processes.

## Alternatives considered

- Updating the world document on every visit or comet.

## Reason

Avoids write conflicts on popular worlds, gives an audit trail and makes caps easy.

## Consequences

Bloom progress is eventually consistent (it lags by one cron interval). The processor must be chunked and idempotent.
