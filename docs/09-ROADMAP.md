# 09 · Roadmap

Six phases, from the current codebase to a production launch. This page is the
overview and the dependency map. **The actual work-from documents are in
[phases/](phases/)** — one file per phase, each with its full task breakdown,
build order, and exit gate.

Calendar assumes 21 to 24 hours per week, solo, starting **1 September 2026**.
Dates will move. **The order will not.**

---

## The phases

| Phase | File                                                          | Window                      | Objective                                      |
| ----- | ------------------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| **0** | [phase-0-foundation.md](phases/phase-0-foundation.md)         | Weeks 1–3 · Sep 1–20        | Foundation — safe, deployed, restructured      |
| **1** | [phase-1-habit-loop.md](phases/phase-1-habit-loop.md)         | Weeks 4–9 · Sep 21–Nov 1    | The habit loop — a reason to open on a Tuesday |
| **2** | [phase-2-family-testing.md](phases/phase-2-family-testing.md) | Weeks 10–11 · Nov 2–15      | **Your own family uses it** 🎯                 |
| **3** | [phase-3-launch.md](phases/phase-3-launch.md)                 | Weeks 12–15 · Nov 16–Dec 13 | Play Store launch                              |
| **4** | [phase-4-the-moat.md](phases/phase-4-the-moat.md)             | Dec 2026 – Mar 2027         | The moat — languages, kinship, portability     |
| **5** | [phase-5-revenue.md](phases/phase-5-revenue.md)               | Mar 2027 onward             | Revenue                                        |

**Start at [phases/README.md](phases/README.md)** for how to work through these
day to day.

---

## Dependencies

```
Phase 0 security  ─┬─> everything (nothing ships on an open database)
Phase 0 restructure ┴─> Phase 1 (features on the old structure get rewritten)
Phase 0 deploy    ───> Phase 2 (no testers without a real server)
Phase 1 complete  ───> Phase 2 (do not test an unfinished loop on your family)
Phase 2, 14 days  ───> Phase 3 (Play Store gate, hard requirement)
Phase 3 launch    ───> Phase 4 (the moat needs real users to validate)
Phase 4 retention ───> Phase 5 (nobody pays for an app they have left)
```

**The single longest pole is the Play Store 14-day closed test.** It cannot be
compressed, so Phase 2 starts the day Phase 1's exit gate is fully checked.

---

## What each phase actually delivers

| Phase | You cannot skip this because...                                                                                                  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| 0     | The database is publicly readable today, and three data planes make every Phase 1 feature impossible to build correctly          |
| 1     | Without Tithi and a real Vriksha rewrite, there is no reason for anyone to open the app twice — see [00-VISION.md](00-VISION.md) |
| 2     | Nobody outside you has ever used this app. Every assumption gets tested here, and it is also the mandatory Play Store gate       |
| 3     | The first public users, timed to wedding season on purpose — see [12-BUSINESS.md §5.2](12-BUSINESS.md#52-wedding-season)         |
| 4     | This is the moat — what a funded competitor cannot copy in a quarter                                                             |
| 5     | Revenue only after retention is proven; charging too early burns trust you cannot rebuild                                        |

For the full task-by-task detail behind any row above, open its file in
[phases/](phases/).
