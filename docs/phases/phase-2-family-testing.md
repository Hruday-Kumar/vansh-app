# Phase 2 · Your Own Family Uses It 🎯

|                |                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**  | The first real families. This is the most valuable milestone in the entire plan — the app has never been used by anyone but you |
| **Window**     | Weeks 10–11 (2 weeks, but the clock inside it is fixed — see below)                                                             |
| **Depends on** | [Phase 1 exit gate](phase-1-habit-loop.md#phase-1-exit-gate) — fully checked                                                    |
| **Unlocks**    | Phase 3 — do not submit to the Play Store without this                                                                          |

---

## Why this phase is not optional and cannot be compressed

This phase does two things at once:

1. It satisfies the Play Store closed-testing requirement — a personal
   developer account created after 13 November 2023 needs **12 testers opted
   in continuously for 14 days** before production access is granted
2. It is the first time the app meets people who are not you, which is when
   every assumption in [00-VISION.md](../00-VISION.md) gets tested against
   reality instead of against your own judgment

**On the 12 testers — there is no legitimate shortcut.** Paid tester services
exist and Google has been banning developer accounts over fabricated cohorts;
losing the account ends the project outright, so this is not a risk worth
taking for two weeks of time saved. The honest reframe: **you are building a
family app, so your 12 testers are a family.** Parents, siblings, cousins,
aunts, uncles, in-laws — twelve is a small Indian family gathering, and this is
the highest-value two weeks in the whole plan, not a chore blocking the Play
Store.

---

## Workstream 2.1 — Set up

1. [ ] Pay the $25 Google Play developer registration
2. [ ] Create the app listing (draft — full store-readiness detail is
       Phase 3's job, this is enough to attach a closed test)
3. [ ] Upload the first closed-testing build
4. [ ] Recruit the 12 family testers; confirm each has explicitly opted in
       through the Play Console testing link, not just installed an APK
5. [ ] Start the 14-day clock and note the date it completes
6. [ ] Set up a feedback channel — a WhatsApp group is correct here, both
       practically and because dogfooding your own growth channel is useful
       signal

## Workstream 2.2 — Instrument before you need it

1. [ ] Confirm Sentry alerts reach you immediately on any crash
2. [ ] Wire event tracking for the metrics in
       [06-ENGAGEMENT.md §7](../06-ENGAGEMENT.md#7-metrics-we-actually-watch) —
       families with a posting elder, voice stories per family per month,
       occasions with 3+ voice wishes, WhatsApp shares per family per month,
       widget installs, D30 retention
3. [ ] Build a dashboard you will actually open daily — a spreadsheet pulling
       from the database is enough; do not over-invest in tooling here

## Workstream 2.3 — Watch, then fix

This is the core activity of the phase. The building is mostly done; this is
observation and rapid response.

1. [ ] Watch at least one elder use the app **in person, without helping them**.
       Write down every single stumble, no matter how small it seems
2. [ ] Fix every crash within 24 hours of it appearing in Sentry
3. [ ] Fix every "I could not find X" or "I did not know I could do that"
       reported by a tester within 3 days
4. [ ] Log every genuine surprise — something that contradicts an assumption
       in [00-VISION.md](../00-VISION.md) or [06-ENGAGEMENT.md](../06-ENGAGEMENT.md)
       — as an entry in [13-LESSONS.md](../13-LESSONS.md)
5. [ ] Ship a build at least once a week; do not let fixes queue up unreleased
6. [ ] Specifically watch open question **Q4** — whether punya tithi feels
       welcome or intrusive to real families — and be ready to make it more
       clearly opt-in if the answer is uncomfortable

---

## Phase 2 exit gate

- [ ] 12 testers opted in for **14 continuous days** — the Play Console record
      of this, not your own estimate, is the source of truth
- [ ] **At least 5 families using it**, not just individuals with no one else
      on their tree
- [ ] **At least one grandparent has posted something** — this is the single
      metric that says the core thesis of the product works; see
      [00-VISION.md §8](../00-VISION.md#8-success-defined)
- [ ] Zero crashes in the final 7 days of the test
- [ ] 10 or more voice stories recorded by people who are not you
- [ ] A Tithi occasion fired for a real person and collected wishes from 3 or
      more relatives
- [ ] Every entry in [13-LESSONS.md](../13-LESSONS.md) from this phase is
      written, not left as a note-to-self

**If the grandparent-posted box cannot be checked, do not proceed to Phase 3.**
Go back to the Elder Path work in
[Phase 1, workstream 1.9](phase-1-habit-loop.md#workstream-19--elder-path-and-languages)
and find out why, because a launch without elder participation is a launch of
a different, less valuable product than the one this plan describes.

**When every box above is checked, open
[phase-3-launch.md](phase-3-launch.md).**
