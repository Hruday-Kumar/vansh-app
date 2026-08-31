# 08 · How We Build

The development process. Chosen for one developer at 21 to 24 hours a week,
with no team to coordinate and no room for ceremony that does not pay for itself.

---

## 1. The model: documentation-driven, trunk-based, vertical slices

Not Scrum. Not Kanban theatre. Three practices, each earning its place:

### 1.1 Documentation-driven

**A feature is specified in `docs/` before it is coded.** Not a formal spec —
a section in [PRODUCT](01-PRODUCT.md) with a definition of done.

Why this matters more for a solo developer than for a team: you have no one to
catch you building the wrong thing. The document is the reviewer. It also means
that when you return to the code after three weeks away, the intent survived.

**Rule: if code and docs disagree, one of them changes in the same commit.**

### 1.2 Trunk-based

One long-lived branch: `main`. Short-lived feature branches, merged within 2 to
3 days. No `develop`, no release branches, no long-running refactor branches.

Why: a solo developer with three parallel branches has three merge conflicts
with themselves and no one to help resolve them. Anything that cannot land in
three days is decomposed until it can, behind a feature flag if necessary.

### 1.3 Vertical slices

A unit of work goes **all the way through the stack** — schema, API, repo,
store, UI, test — for **one small capability**, rather than "build all the
endpoints" then "build all the screens".

```
❌  Week 1: all Postgres tables
    Week 2: all API endpoints
    Week 3: all screens
    -> nothing works until week 3, and week 3 reveals week 1 was wrong

✅  Day 1-2: "add a member" — table, endpoint, repo, store, screen, test
    Day 3-4: "tag a person in a photo" — same, end to end
    -> something works every two days, and mistakes surface immediately
```

Every slice ends with **something demonstrable on a real phone.**

---

## 2. The loop

```
   pick the next slice from ROADMAP
              |
              v
   confirm/extend the spec in docs/
              |
              v
   branch: feat/<slice-name>
              |
              v
   +---> write the test that fails      (model/ and repo/ logic)
   |          |
   |          v
   |     make it pass, thinnest thing that works
   |          |
   |          v
   |     run on a REAL DEVICE, not just the emulator
   |          |
   +----- not right? iterate
              |
              v
   typecheck + lint + test green
              |
              v
   self-review the diff as if someone else wrote it
              |
              v
   squash-merge to main, delete the branch
              |
              v
   tick the checklist item in ROADMAP
```

**The real-device step is not optional.** The target user is on a ₹12,000
Android phone on a patchy 4G connection. The emulator lies about both.

---

## 3. Testing strategy

We are not chasing a coverage number. We test what breaks and what is expensive
to get wrong.

| Layer                                  | Tool                               | What                                                                  | Coverage target                     |
| -------------------------------------- | ---------------------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| **Domain logic** (`features/*/model/`) | Jest, plain node                   | Tree layout, kinship resolution, occasion computation, conflict rules | **90%+**                            |
| **Sync** (`core/sync/`)                | Jest                               | Outbox, idempotency, LWW, poisoned ops                                | **90%+**                            |
| **Repos** (`features/*/repo/`)         | Jest + in-memory SQLite            | Queries, migrations                                                   | 70%                                 |
| **Server modules**                     | Jest + supertest + a test Postgres | Every endpoint, especially authorisation                              | 80%                                 |
| **Components**                         | React Native Testing Library       | Only complex interactive ones                                         | Opportunistic                       |
| **Journeys**                           | Maestro                            | 6 critical flows                                                      | The flows, not a percentage         |
| **Performance**                        | Custom harness                     | Tree at 200 nodes, cold start                                         | Budgets from ARCHITECTURE section 9 |

### The six Maestro journeys

1. Sign in with Google, then complete onboarding
2. Add three family members and see the tree render
3. Upload photos to an album, tag a person
4. Record a voice comment on a photo
5. Record a voice birthday wish from a Tithi card
6. Go offline, make three edits, come back online, verify convergence

Journey 6 is the one that catches the bugs that lose people, data.

### Non-negotiable tests

| Rule                                                        | Why                                   |
| ----------------------------------------------------------- | ------------------------------------- |
| Every tree-layout change runs the 8 golden fixtures         | The tree is the MVP                   |
| Every endpoint has a cross-tenant authorisation test        | The likeliest data leak               |
| Every sync change runs the offline convergence journey      | Data loss is unrecoverable trust loss |
| Every bug fix ships with the test that would have caught it | See [LESSONS](13-LESSONS.md)          |

---

## 4. Definition of Done

A slice is not done until every box is ticked. No partial credit.

- [ ] Behaviour matches the spec in `docs/`
- [ ] `npx tsc --noEmit` clean
- [ ] `npx eslint .` clean, including import-boundary zones
- [ ] Unit tests written and passing
- [ ] **Run on a real Android device**
- [ ] Works offline, or degrades with a clear message
- [ ] **Elder Path checked** — 20pt text, 48dp targets, voice path exists
- [ ] Strings are in i18n files, not hardcoded — `en`, `hi`, `te` all present
- [ ] No `console.log` left behind
- [ ] Errors surface to the user _and_ to Sentry
- [ ] Loading and empty states exist
- [ ] Docs updated in the same commit if behaviour changed

---

## 5. Branching, commits and CI

| Item          | Convention                                                     |
| ------------- | -------------------------------------------------------------- |
| Branches      | `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`                |
| Commits       | Conventional Commits: `feat(vriksha): ego-centric layout`      |
| Merge         | Squash. One slice, one commit on `main`                        |
| `main`        | Always releasable. Broken `main` is fixed before anything else |
| Feature flags | `core/config/flags.ts`. Anything incomplete ships dark         |

**CI on every push** (GitHub Actions, well within 2,000 free minutes):

```
typecheck -> lint -> unit tests -> server tests -> i18n key check -> build APK
```

The i18n check fails the build when a key exists in `en` but is missing in
`hi` or `te`. That is what stops the language surface rotting.

---

## 6. Release process

| Stage          | Track                           | Cadence                 |
| -------------- | ------------------------------- | ----------------------- |
| Internal       | Local APK on your own device    | Continuous              |
| Closed testing | Play Console, 12 family testers | Weekly during Phase 2   |
| Production     | Play Console, staged rollout    | Every 2 to 3 weeks      |
| Hotfix         | Expo OTA for JS-only fixes      | As needed, within hours |

**Staged rollout is mandatory:** 10% for 48 hours, watch Sentry, then 50%,
then 100%. A solo developer cannot afford to discover a crash at full rollout.

**Versioning:** semver in `package.json`, and `app.json` `version` and
`versionCode` **must** match. They currently do not — `app.json` says 1.0.0 and
`package.json` says 2.0.0. A CI check enforces this from Phase 0.

---

## 7. Working with an AI pair (how this repo is actually built)

An honest section, because it is how the work happens.

| Practice                                                    | Rule                                                                         |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Docs are the shared context                                 | Point at `docs/`, not at a fresh explanation each session                    |
| One slice per session                                       | Matches the vertical-slice unit                                              |
| Tests before implementation                                 | The strongest guard against confidently wrong code                           |
| Read the diff yourself                                      | Generated code that compiles can still be wrong                              |
| Never accept a security or crypto implementation unreviewed | See [SECURITY](07-SECURITY-PRIVACY.md) section 3 for what happened last time |
| Record surprises in LESSONS                                 | See [LESSONS](13-LESSONS.md)                                                 |

The `encryption.ts` XOR-labelled-AES bug is the canonical example of what this
discipline exists to prevent: plausible-looking code, a comment explaining the
shortcut, and a name that lies about what it does.

---

## 8. Cadence at 21 to 24 hours a week

A realistic week, not an aspirational one:

| Block                | Hours | Use                                            |
| -------------------- | ----- | ---------------------------------------------- |
| Two weekday evenings | 6     | One vertical slice, start to finish            |
| Saturday             | 8     | The hard thing — algorithms, sync, native work |
| Sunday               | 6     | A second slice, plus device testing            |
| Reserve              | 2–4   | Overruns, CI breakage, dependency upgrades     |

**Every fourth week is a consolidation week:** no new features. Fix bugs, pay
down debt, update docs, upgrade dependencies, write the lessons entries.
Skipping these is how a solo project accumulates the debt that eventually stops it.

---

## 9. Decision records

Any decision that is expensive to reverse gets a short ADR in `docs/adr/`,
indexed in [DECISIONS](14-DECISIONS.md).

```markdown
# ADR-0007: Union nodes for marriages

Date: 2026-09-14
Status: Accepted

## Context

Person-to-person spouse edges make remarriage and same-sex couples special cases,
and let spouses drift apart in layout.

## Decision

Model a marriage as a synthetic UNION node.

## Consequences

- GEDCOM FAM maps 1:1
- Remarriage needs no special case

* One more node type in the layout algorithm
```

Five sentences is enough. The point is that six months from now you remember
_why_, not that the document is thorough.

---

**Sources:**
[React Native Best Practices 2026](https://www.applighter.com/blog/react-native-best-practices) ·
[Mobile App Architecture 2026](https://www.applighter.com/blog/mobile-app-architecture) ·
[Scalable React Native apps, 2026 guide](https://wadline.com/mag/scalable-react-native-mobile-apps-2026-complete-guide)
