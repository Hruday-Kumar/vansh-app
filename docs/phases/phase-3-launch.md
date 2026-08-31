# Phase 3 · Launch

|                |                                                                                    |
| -------------- | ---------------------------------------------------------------------------------- |
| **Objective**  | Publicly installable on the Play Store, and every share leads somewhere good       |
| **Window**     | Weeks 12–15 (4 weeks ≈ 85–95 hours), deliberately placed to land in wedding season |
| **Depends on** | [Phase 2 exit gate](phase-2-family-testing.md#phase-2-exit-gate) — fully checked   |
| **Unlocks**    | Phase 4                                                                            |

---

## Why this phase is timed the way it is

Indian wedding season runs November–February and April–June, and it is the
single highest-intent moment for a family app: digital invitations, shared
post-wedding albums, a printed family tree as a gift. **A mid-December launch
is deliberate**, not a coincidence of the numbering — see
[12-BUSINESS.md §5.2](../12-BUSINESS.md#52-wedding-season). If Phase 2 runs
long, protect this timing over protecting the calendar slot for Phase 3 itself.

---

## Workstream 3.1 — Store readiness

Work every line of [10-PRODUCTION-CHECKLIST.md](../10-PRODUCTION-CHECKLIST.md)
before this workstream is considered started, not just at the end of it — that
document is the actual gate, this is the sequencing around it.

1. [ ] Complete every section of
       [10-PRODUCTION-CHECKLIST.md](../10-PRODUCTION-CHECKLIST.md) — security,
       privacy, reliability, performance, data integrity, accessibility, i18n,
       store readiness, operations, honesty
2. [ ] Write the store listing in English, Hindi, and Telugu
3. [ ] Produce screenshots showing the feed, the tree, a voice comment in
       progress, and a Tithi occasion card
4. [ ] Produce a 30-second preview video
5. [ ] Publish the privacy policy with a named grievance officer and email
6. [ ] Complete the Play Data Safety form — **truthfully**, matching what the
       app actually does per
       [10-PRODUCTION-CHECKLIST.md §10](../10-PRODUCTION-CHECKLIST.md#10-honesty)
7. [ ] Complete the content rating questionnaire

## Workstream 3.2 — DPDP compliance

Full detail in [07-SECURITY-PRIVACY.md §6](../07-SECURITY-PRIVACY.md#6-dpdp-act-2023-compliance).

1. [ ] Consent notice at sign-up, in the user's selected language, versioned
       and timestamped
2. [ ] `GET /v1/me/export.zip` — data export, complete and readable
3. [ ] Account deletion with a 30-day grace period before hard delete
4. [ ] The erasure-versus-family-tree trade-off is explained in plain
       language inside the deletion flow itself, not buried in the privacy
       policy — see
       [07-SECURITY-PRIVACY.md §6](../07-SECURITY-PRIVACY.md#the-hard-question-erasure-versus-the-family-tree)
       for exactly what this trade-off is and how to phrase it
5. [ ] Breach runbook written and linked from `docs/RUNBOOK.md`

## Workstream 3.3 — Launch

1. [ ] Staged rollout: 10% of installs for 48 hours, watch Sentry closely,
       then 50%, then 100% — do not skip a stage even if 10% looks clean
2. [ ] Publish the landing page at `sarvasvam.app`
3. [ ] Verify public share links render correctly and preview correctly when
       pasted into WhatsApp — this was built in Phase 1 workstream 1.8; this
       is the final check under real store conditions, not a rebuild
4. [ ] Tell your Phase 2 testers first, before any wider announcement — they
       are also your first real growth-loop test

---

## Phase 3 exit gate

- [ ] Live on the Play Store in India, at 100% rollout
- [ ] Crash-free sessions above 99.5%, measured over the rollout period
- [ ] 25 families installed
- [ ] The sharing loop is verified with a real example: a WhatsApp share
      produced at least one real install that you can trace

**When every box above is checked, open
[phase-4-the-moat.md](phase-4-the-moat.md).**
