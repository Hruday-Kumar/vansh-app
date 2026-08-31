# ADR-0007: Oracle plus Neon plus Cloudflare R2

Date: 2026-08-31 · Status: Accepted

## Context

Zero recurring budget. The app is read-heavy, so egress is the cost that
matters most.

## Decision

Oracle Cloud Always Free ARM VM for compute, Neon for Postgres, Cloudflare R2
for objects. Supabase is rejected.

## Consequences

- R2 charges zero egress, ever — the single most important line item
- Neon stays always-on; Supabase pauses a project after 7 days of inactivity,
  which is fatal for a family app used fortnightly

* Oracle may reclaim an idle VM; a Hetzner CX22 fallback is documented
* Free tiers cap us at roughly 150 families, with scaling triggers recorded
