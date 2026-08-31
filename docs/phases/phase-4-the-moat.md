# Phase 4 · The Moat

|                |                                                          |
| -------------- | -------------------------------------------------------- |
| **Objective**  | Build what a competitor cannot copy in a quarter         |
| **Window**     | December 2026 – March 2027                               |
| **Depends on** | [Phase 3 exit gate](phase-3-launch.md#phase-3-exit-gate) |
| **Unlocks**    | Phase 5                                                  |

---

## Why this phase, and why now and not earlier

Everything in this phase was buildable in Phase 1 in a technical sense. It
waits until after launch on purpose: the moat is proven against real families,
not built on speculation about what they will want. See
[12-BUSINESS.md §2](../12-BUSINESS.md#the-competitive-read) for the strategic
framing — this is where the "harder side of the asymmetry" argument gets cashed
in against Aangan, My Parivar, and Mahaparivar.

This phase has no strict internal ordering the way Phases 0 and 1 do — each
item below is close to independent. Sequence by what your Phase 3 data
actually shows people want, per open question **Q7** in
[13-LESSONS.md](../13-LESSONS.md#open-questions).

---

## Workstream 4.1 — Kinship expansion ⭐

1. [ ] Extend the kinship database to 10 languages total — add Kannada,
       Malayalam, Gujarati, Punjabi, Odia, Assamese (wave 3–4 in
       [01-PRODUCT.md §11.2](../01-PRODUCT.md#112-languages-p0--p5))
2. [ ] Every language file verified by **at least two native speakers from
       different regions** before shipping — see
       [05-KINSHIP.md §7](../05-KINSHIP.md#7-coverage-plan)
3. [ ] Add the corresponding UI translation namespaces, with the CI missing-key
       check already enforcing completeness

## Workstream 4.2 — Portability

1. [ ] Implement GEDCOM 7 import and export per
       [04-TREE-ALGORITHM.md §7](../04-TREE-ALGORITHM.md#7-gedcom-7-mapping) —
       import is the more valuable direction first, since it lets a family
       switch to us from a competitor with zero data loss on their side
2. [ ] Test import against real exports from VanshApp, Mahaparivar, and at
       least one international genealogy tool
3. [ ] Verify round-tripping our own export is lossless

## Workstream 4.3 — Graph maturity

1. [ ] Duplicate detection heuristics (same given name plus the same parent
       edge, or same name plus birth year within two) and the merge review
       queue — the one conflict class last-write-wins cannot resolve, per
       [02-ARCHITECTURE.md §4.2](../02-ARCHITECTURE.md#42-conflict-resolution)
2. [ ] Suggested-edit flow for changes to existing members, with steward
       approval
3. [ ] Multiple marriages, adoption, and step-relations in the graph model
4. [ ] Gotra, kula, and native-place fields on `members` and `families`

## Workstream 4.4 — Deepening engagement

1. [ ] Indian festival calendar mapped to the family, feeding Tithi cards
2. [ ] Weekly Sunday prompts, per
       [06-ENGAGEMENT.md Layer 4](../06-ENGAGEMENT.md#layer-4--the-weekly-prompt)
3. [ ] Relation-aware album sharing — "share with Dad's side" — built on the
       graph traversal already in `features/vriksha/model/graph.ts`

## Workstream 4.5 — Parampara

1. [ ] Build the traditions and recipes module: creator, detail, list
2. [ ] **Voice narration by the person who makes the dish or performs the
       ritual** — the differentiator called out in
       [01-PRODUCT.md §9](../01-PRODUCT.md#9-paramparā--traditions-and-recipes-p2)
3. [ ] Link traditions to the festival calendar from workstream 4.4

---

## Phase 4 exit gate

- [ ] 10 languages shipped with kinship terms verified by two native speakers
      each
- [ ] A GEDCOM file exported from a real competitor app imports and renders
      correctly
- [ ] 200 families using the app
- [ ] D30 retention above 40% for the Keeper persona

**When every box above is checked, open
[phase-5-revenue.md](phase-5-revenue.md).**
