# ADR-0010: Enforced feature-module boundaries

Date: 2026-08-31 · Status: Accepted

## Context

Code is grouped by file type, so one feature is smeared across six directories
and any file can import any other. Smriti alone spans six locations.

## Decision

Four layers — `app` over `features` over `shared` over `core` — with the
dependency direction enforced by ESLint `import/no-restricted-paths`, and each
feature exposing only its `index.ts`.

## Consequences

- A feature can be understood, tested and deleted in one place
- `model/` stays pure TypeScript, so the tree and kinship algorithms are
  testable without a renderer

* A one-time restructure of 190 files, in nine revertible commits
* Occasional friction when two features genuinely need to share; the answer is
  to move the shared thing into `core/`
