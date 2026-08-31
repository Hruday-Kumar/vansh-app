# 04 · Tree Algorithm

The tree is the MVP and it must never break. Today it does. This is the rewrite.

---

## 1. What is wrong today

`src/features/vriksha/tree-layout.ts` is a 773-line six-phase custom pipeline
built on BFS. Its failure modes:

| Problem                | Cause                                                      |
| ---------------------- | ---------------------------------------------------------- |
| Edges cross constantly | No crossing-minimisation phase exists                      |
| Spouses drift apart    | Couples are not treated as a single unit                   |
| Generations misalign   | BFS depth is not the same thing as generation              |
| Breaks on cycles       | Cousin marriage is common in India and creates real cycles |
| Slows past ~80 nodes   | Repeated full recomputation                                |

**The root error: a family is not a tree.** It is a directed acyclic graph with
two edge types, and in India it frequently contains cycles from cousin marriage.
Any algorithm that assumes a single root and one parent per node will fail on
real Indian family data.

---

## 2. The data model

Two node types, two edge types. Everything else is derived.

```
PERSON  -- an individual
UNION   -- a marriage or partnership; a synthetic node

edges:  PERSON --spouse--> UNION      (1 or 2 per union)
        UNION  --child-->  PERSON
```

Modelling marriage as a **union node** rather than a person-to-person edge is
the single most important decision in this document. It gives us:

- Spouses that are structurally adjacent and cannot drift apart
- Children that hang off the couple, not off one parent
- Remarriage as simply a second union — no special case
- Same-sex and single-parent families with no special case
- A clean mapping to GEDCOM, where `FAM` _is_ the union node

---

## 3. The layout pipeline — Sugiyama

Replace the BFS pipeline with a **Sugiyama layered layout** over the
person/union graph. Four phases, each independently testable.

### Phase 1 — Layer assignment (generation)

Assign each person an integer generation. **Longest-path ranking, not BFS.**

```
generation(p) = 0                             if p has no parents
generation(p) = 1 + max(generation(parent))   otherwise
```

BFS assigns the _shortest_ path, which places a person one generation too high
whenever there are two routes to them — exactly what happens with cousin
marriage. Longest-path is correct.

Cycles are broken first with a DFS that reverses back-edges; reversed edges are
restored for rendering and drawn with a distinct style.

**Constraint:** both spouses in a union must share a generation. Where they do
not, promote the lower one and record a `generation_override`.

### Phase 2 — Crossing minimisation (ordering)

Order the nodes within each layer to minimise edge crossings.

```
for sweep in 1..24:
    downward: order layer i+1 by the median x of parents in layer i
    upward:   order layer i-1 by the median x of children in layer i
    keep the ordering with the fewest crossings
    stop early if no improvement for 4 sweeps
```

The **median heuristic** is the standard and is near-optimal in practice.
Additional constraints for family trees:

- Spouses in a union are adjacent and never separated
- Siblings stay contiguous, ordered by birth date
- A union node sits at the mean x of its two spouses

### Phase 3 — X coordinates (Brandes-Köpf)

Given the ordering, assign horizontal positions. Brandes-Köpf produces four
candidate alignments (up/down by left/right), then averages them. It guarantees
vertical edges where possible and balanced parent placement over children,
which is what makes a family tree _look_ right.

Simplified rules if the full algorithm proves too heavy:

- A parent is centred over the span of its children
- Siblings are evenly spaced at `NODE_W + GAP`
- Subtrees never overlap: sweep left to right, push right on collision

### Phase 4 — Edge routing

- Parent to union: a vertical drop to a shared horizontal bus, then down
- Union to child: an orthogonal elbow from the bus
- Spouse to spouse: a short horizontal segment
- Long edges spanning more than one layer route through invisible dummy nodes
  inserted in Phase 1 — this is what keeps them from cutting across other nodes

---

## 4. Ego-centric rendering

A 300-person tree rendered whole is unreadable on a phone. **The default view is
ego-centric**: the tree is drawn relative to _you_.

| Ring | Content                                                           | Rendered                                    |
| ---- | ----------------------------------------------------------------- | ------------------------------------------- |
| 0    | You                                                               | Large, centred, highlighted                 |
| 1    | Parents, spouse, children, siblings                               | Full detail                                 |
| 2    | Grandparents, aunts and uncles, nieces and nephews, grandchildren | Full detail                                 |
| 3    | Cousins, great-grandparents                                       | Compact                                     |
| 4+   | Everyone else                                                     | Collapsed into "+12 more" chips, expandable |

Layout runs on the **visible subgraph only** — typically 30 to 60 nodes, not 300.
This is what delivers the sub-400 ms budget. Tapping any person re-centres the
view on them, which is also the most natural way to explore a family.

---

## 5. Performance

| Technique                                   | Effect                                |
| ------------------------------------------- | ------------------------------------- |
| Layout on the visible subgraph only         | 300 nodes becomes ~50                 |
| Cache layout keyed by graph hash and ego id | No recompute on pan or zoom           |
| Incremental relayout on add                 | Only affected layers recompute        |
| Render with react-native-skia               | One canvas, not 300 native views      |
| Viewport culling                            | Skip nodes outside the visible rect   |
| Thumbnails at 300px, memory-cached          | Avoids decoding full photos           |
| Run layout in a worklet                     | Keeps the JS thread free for gestures |

**Budget: 200 members laid out in under 400 ms; pan and zoom at a sustained
60 fps.** Both are asserted in a performance test, not left to feel.

---

## 6. Testing

The tree is the MVP, so it gets the strictest tests in the codebase.
All of `model/` is pure TypeScript and runs under plain Jest.

| Test                   | Asserts                                                     |
| ---------------------- | ----------------------------------------------------------- |
| Golden fixtures        | 8 real family shapes lay out to a stable snapshot           |
| Zero crossings         | A tree with no cousin marriage has zero edge crossings      |
| Cousin marriage        | A graph with a cycle still terminates and renders           |
| Generation correctness | Longest-path beats BFS on a known trap case                 |
| Spouse adjacency       | Spouses are always adjacent in the final ordering           |
| Sibling order          | Siblings appear in birth-date order                         |
| Determinism            | The same input yields byte-identical output                 |
| Performance            | 200 nodes in under 400 ms                                   |
| Fuzz                   | 1,000 random valid graphs never throw and never produce NaN |

Fixture families kept in `model/layout/__fixtures__/`:
nuclear (5) · three-generation joint (18) · cousin marriage (22) ·
remarriage with step-children (14) · single parent (4) ·
adoption (7) · four-generation (40) · stress (200)

---

## 7. GEDCOM 7 mapping

Our union node maps directly onto GEDCOM `FAM`, which is why the model was
chosen. Import and export are close to mechanical.

| GEDCOM                  | Ours                                        |
| ----------------------- | ------------------------------------------- |
| `INDI`                  | `members` row                               |
| `FAM`                   | union node — a `spouse` relation pair       |
| `FAM.HUSB` / `FAM.WIFE` | `relations(kind='spouse')`                  |
| `FAM.CHIL`              | `relations(kind='parent_child')`            |
| `INDI.BIRT.DATE`        | `members.birth_date` plus `birth_date_prec` |
| `INDI.DEAT.DATE`        | `members.death_date`                        |
| `INDI.SEX`              | `members.gender`                            |
| `FAM.MARR.DATE`         | `relations.start_date`                      |
| `INDI.NAME`             | `given_name` and `family_name`              |

**Scope:** import and export of the above. We do **not** implement sources,
citations, notes, media links or submitter records. Round-tripping our own
export must be lossless; importing a foreign file is best-effort, and anything
unmapped is preserved verbatim in a `gedcom_extra` JSONB column so a later
export does not destroy it.

Members with `hide_from_share` are excluded from export, and living people are
exported without a birth date unless the exporter explicitly opts in.

---

## 8. Files

```
features/vriksha/model/
├── graph.ts                 # adjacency, traversal, ego subgraph extraction
├── layout/
│   ├── index.ts             # orchestrates the four phases
│   ├── rank.ts              # Phase 1 — longest-path plus cycle breaking
│   ├── order.ts             # Phase 2 — median crossing minimisation
│   ├── position.ts          # Phase 3 — Brandes-Kopf x coordinates
│   ├── route.ts             # Phase 4 — orthogonal edge routing
│   ├── constants.ts         # NODE_W, NODE_H, GAP, LAYER_H
│   └── __fixtures__/        # the 8 golden families
├── kinship/                 # see KINSHIP.md
└── gedcom/
    ├── parse.ts
    └── serialise.ts
```
