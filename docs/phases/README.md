# Build Phases

Each phase is a standalone, work-from-directly document — not a summary. Open
one file, work through it top to bottom, tick its boxes, hit its exit gate,
move to the next.

**This directory is what you actually build from.** [09-ROADMAP.md](../09-ROADMAP.md)
stays as the one-page overview and dependency map; these files are the detail
underneath each of its six rows.

---

## The phases

| #   | File                                                   | Objective                                  | Depends on                         |
| --- | ------------------------------------------------------ | ------------------------------------------ | ---------------------------------- |
| 0   | [phase-0-foundation.md](phase-0-foundation.md)         | Safe, deployed, restructured               | Nothing — start here               |
| 1   | [phase-1-habit-loop.md](phase-1-habit-loop.md)         | A reason to open the app on a Tuesday      | Phase 0 exit gate                  |
| 2   | [phase-2-family-testing.md](phase-2-family-testing.md) | Your own family uses it                    | Phase 1 exit gate                  |
| 3   | [phase-3-launch.md](phase-3-launch.md)                 | Live on the Play Store                     | Phase 2, 14 continuous tester-days |
| 4   | [phase-4-the-moat.md](phase-4-the-moat.md)             | What competitors cannot copy in a quarter  | Phase 3 exit gate                  |
| 5   | [phase-5-revenue.md](phase-5-revenue.md)               | The first rupee, without breaking the loop | Phase 4 exit gate                  |

---

## How to use one of these files

1. Read the **Objective** and **Why** sections once, so the checklist below them
   makes sense instead of feeling arbitrary
2. Work the **workstreams in the order given** — they are ordered so that each
   one only depends on what came before it in the same file
3. Follow [08-SDLC.md](../08-SDLC.md) for the loop within each task: spec, test,
   build, real device, review, merge, tick the box
4. Do not start the next phase's file until this one's **exit gate** is fully
   checked. A phase with an unchecked exit-gate box is not done, no matter how
   much of the feature list is finished
5. If something surprises you while working a phase, write it into
   [13-LESSONS.md](../13-LESSONS.md) before moving on — that is what keeps this
   directory honest over six months

## Cross-references every phase file uses

| When a phase says...                  | ...it means the detail lives in                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| A feature or its definition of done   | [01-PRODUCT.md](../01-PRODUCT.md)                                                                      |
| A schema, endpoint, or infra choice   | [02-ARCHITECTURE.md](../02-ARCHITECTURE.md)                                                            |
| Where a file goes or what replaces it | [03-CODEBASE-STRUCTURE.md](../03-CODEBASE-STRUCTURE.md), [11-FILE-MANIFEST.md](../11-FILE-MANIFEST.md) |
| Tree layout or GEDCOM detail          | [04-TREE-ALGORITHM.md](../04-TREE-ALGORITHM.md)                                                        |
| A kinship term or resolver detail     | [05-KINSHIP.md](../05-KINSHIP.md)                                                                      |
| An engagement mechanic                | [06-ENGAGEMENT.md](../06-ENGAGEMENT.md)                                                                |
| A security or DPDP requirement        | [07-SECURITY-PRIVACY.md](../07-SECURITY-PRIVACY.md)                                                    |
| The release gate before shipping      | [10-PRODUCTION-CHECKLIST.md](../10-PRODUCTION-CHECKLIST.md)                                            |
| Pricing, GTM, or a competitor fact    | [12-BUSINESS.md](../12-BUSINESS.md)                                                                    |

A phase file tells you **what to build and in what order.** The linked
documents tell you **how to build it correctly.** Read both.
