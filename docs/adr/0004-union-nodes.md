# ADR-0004: Union nodes for marriages

Date: 2026-08-31 · Status: Accepted

## Context

Person-to-person spouse edges make remarriage, same-sex and single-parent
families special cases, and let spouses drift apart during layout.

## Decision

Model a marriage as a synthetic UNION node. Children hang off the union.

## Consequences

- GEDCOM `FAM` maps one-to-one
- Remarriage is simply a second union — no special case
- Spouses are structurally adjacent and cannot separate in layout

* One more node type for the layout algorithm to handle
