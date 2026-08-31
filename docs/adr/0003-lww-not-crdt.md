# ADR-0003: Last-write-wins, not CRDTs

Date: 2026-08-31 · Status: Accepted

## Context

Multiple relatives edit the same tree from multiple devices, often offline.

## Decision

Last-write-wins per field, using the server timestamp. Not CRDTs.

## Consequences

- Days of work instead of weeks; simple to reason about and to test
- Handles the overwhelming majority of real edits, which touch different fields

* Cannot resolve two people adding the same person; that goes to a
  duplicate-merge queue with a human in the loop
* A simultaneous same-field edit silently loses one value; recoverable from
  `change_log`, and rare enough to accept
