# ADR-0001: Postgres over MySQL

Date: 2026-08-31 · Status: Accepted

## Context

The backend runs MySQL 8. The kinship graph needs recursive traversal, the feed
needs date-partial indexes, and unmapped GEDCOM fields need JSON storage.

## Decision

Migrate to Postgres 17, hosted on Neon.

## Consequences

- Recursive CTEs for graph queries; expression indexes for the Tithi month/day lookup
- JSONB for `gedcom_extra` and `change_log.payload`; partial indexes for soft deletes
- Neon free tier is always-on, unlike Supabase

* A one-time migration of schema, queries and the `mysql2` driver
