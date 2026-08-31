# ADR-0002: Remove Firebase entirely

Date: 2026-08-31 · Status: Accepted

## Context

Firebase Realtime Database was added during prototyping for QR-triggered tree
sync. Its rules allow unauthenticated reads of every tree, the app uses no
Firebase Auth, and its credentials are committed to the repository.

## Decision

Lock the rules, rotate the key, and remove Firebase in favour of our own
authenticated API with outbox-based sync.

## Consequences

- One data plane instead of three; one auth model; one place to reason about access
- No vendor tier to outgrow

* We own reconnection, backoff and conflict resolution ourselves
* Sync latency rises from near-instant to next-foreground, which is acceptable
  for a family feed
