# Phase 1 · The Habit Loop

|                |                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------- |
| **Objective**  | By the end of this phase, the app has a reason to be opened on a Tuesday when nothing has happened |
| **Window**     | Weeks 4–9 (6 weeks ≈ 130–145 hours)                                                                |
| **Depends on** | [Phase 0 exit gate](phase-0-foundation.md#phase-0-exit-gate) — fully checked, not partially        |
| **Unlocks**    | Phase 2 — do not put this in front of your family until it is finished                             |

---

## Why this is the phase that matters most

Phase 0 made the app safe and buildable. This phase is what makes it a product
instead of a photo folder. The whole thesis in
[00-VISION.md](../00-VISION.md) — that a real kinship graph makes a feed
intelligent in a way nothing else can — either becomes real here or the product
does not have a reason to exist. Two workstreams below, **Tithi** and
**Vriksha**, are not optional scope; they are the product.

**Follow [08-SDLC.md](../08-SDLC.md)'s vertical-slice discipline for every item
below:** schema through UI through test, on a real device, before moving to the
next item. Do not build every schema first, then every endpoint, then every
screen — that produces six weeks where nothing runs.

**Suggested build order across workstreams**, because later ones depend on
earlier ones existing even though each workstream is listed as a whole below:

```
1.3 Vriksha (the graph must exist before anything can be "about" a person)
1.2 Tithi   (needs the graph's birth dates and relations)
1.4 Smriti  (needs members to tag)
1.5 Katha   (needs members and events to attach to)
1.1 Pravāha (needs all of the above to have cards to show)
1.9 Elder Path + languages (threaded through all of the above, not last)
1.6 Jharokhā widget
1.7 Nimantraṇa
1.8 Sharing and growth
1.10 Onboarding and demo (assembles everything into first-run)
```

---

## Workstream 1.3 — Vriksha rewrite (build this first)

Full technical detail in [04-TREE-ALGORITHM.md](../04-TREE-ALGORITHM.md).

1. [ ] Implement `features/vriksha/model/graph.ts` — the union-node graph
       model: `PERSON` and `UNION` nodes, `spouse` and `child` edges
2. [ ] Implement `model/layout/rank.ts` — Phase 1 of Sugiyama: longest-path
       generation assignment with cycle-breaking for cousin marriage
3. [ ] Implement `model/layout/order.ts` — Phase 2: median-heuristic crossing
       minimisation, with spouse-adjacency and sibling-order constraints
4. [ ] Implement `model/layout/position.ts` — Phase 3: Brandes-Köpf x
       coordinates (or the simplified centring rules if the full algorithm
       proves too heavy for the time budget)
5. [ ] Implement `model/layout/route.ts` — Phase 4: orthogonal edge routing
       through the shared parent-union bus
6. [ ] Build the 8 golden fixture families in
       `model/layout/__fixtures__/` — nuclear, three-generation joint, cousin
       marriage, remarriage with step-children, single parent, adoption,
       four-generation, stress (200 nodes) — and snapshot-test layout against
       each
7. [ ] Implement `model/kinship/resolver.ts`, `path.ts`, `rules.ts` per
       [05-KINSHIP.md §5](../05-KINSHIP.md#5-the-resolution-algorithm)
8. [ ] Author the `en`, `hi`, `te` kinship term files in
       `shared/i18n/kinship/` — see
       [05-KINSHIP.md §4](../05-KINSHIP.md#4-the-term-database) for the
       format and §7 for sourcing (verify with two native speakers per
       language before trusting a term)
9. [ ] Build `ui/tree-canvas.tsx` on `react-native-skia` — one canvas, viewport
       culling, layout run in a worklet
10. [ ] Build ego-centric rendering: ring 0 (you) through ring 4+ (collapsed
        chips), per [04-TREE-ALGORITHM.md §4](../04-TREE-ALGORITHM.md#4-ego-centric-rendering)
11. [ ] Build `ui/member-node.tsx`, `ui/edges.tsx`, `ui/member-sheet.tsx`,
        `ui/add-member.tsx`
12. [ ] Wire `repo/member-repo.ts` and `repo/relation-repo.ts` onto
        `core/sync` and `core/db`
13. [ ] Performance test: 200 members lay out in under 400 ms; pan and zoom
        sustain 60 fps on a Redmi-class device

**Definition of done:** the 8 golden fixtures pass, the resolver answers every
3-hop relation correctly in Hindi and Telugu, and the performance budget is met
on real hardware, not the emulator.

---

## Workstream 1.2 — Tithi, the occasion engine ⭐⭐

The single highest-leverage module in the product — see
[06-ENGAGEMENT.md §2 Layer 1](../06-ENGAGEMENT.md#layer-1--the-graph-generates-occasions-).
It generates a reason to open the app roughly weekly, forever, from graph
structure alone.

1. [ ] Implement `features/tithi/model/occasions.ts` — derive birthdays and
       wedding anniversaries from `members.birth_date` and
       `relations(kind='spouse').start_date`, using the month/day index from
       [02-ARCHITECTURE.md §3.2](../02-ARCHITECTURE.md#32-required-indexes)
2. [ ] Implement punya tithi (death anniversary) derivation from
       `members.death_date` — see
       [01-PRODUCT.md §6](../01-PRODUCT.md#6-tithi--the-occasion-engine-p0-)
       for why this is the most emotionally significant feature in the app,
       and handle it with care: it must be opt-in per person, never sprung on
       a family that has not set it up (tracked as open question Q4 in
       [13-LESSONS.md](../13-LESSONS.md#open-questions))
3. [ ] Implement `server/src/modules/tithi/` — `GET
    /v1/families/:id/occasions?from=&to=`
4. [ ] Build `ui/occasion-card.tsx` for the feed — see the mockup in
       [01-PRODUCT.md §2](../01-PRODUCT.md#2-the-home-screen--pravāha-p0)
5. [ ] Build `ui/wish-recorder.tsx` — hold-to-record a voice wish, one tap
6. [ ] Build `ui/wish-collection.tsx` — aggregate wishes into a single card
       delivered to the person on their occasion
7. [ ] Wire the kinship resolver from workstream 1.3 into the occasion card so
       the term shown is correct **per viewer**, not a single fixed label
8. [ ] Implement the daily batched push: exactly one notification per user
       per day, always naming a person and a relation — see
       [06-ENGAGEMENT.md §4](../06-ENGAGEMENT.md#4-notification-discipline)
       for the non-negotiable rules

**Definition of done:** for a synthetic 30-member family, the engine produces
the correct occasion set across a full year, with correct kinship terms in
Hindi and Telugu, and never sends more than one notification per user per day.

---

## Workstream 1.4 — Smriti

1. [ ] Implement `core/media/pipeline.ts` — client-side resize to 1600px WebP
       plus a 300px thumbnail, per
       [02-ARCHITECTURE.md §5](../02-ARCHITECTURE.md#5-media-pipeline)
2. [ ] Implement `core/media/upload-queue.ts` — background, resumable,
       survives app kill, queued through the same outbox as other writes
3. [ ] Implement `server/src/modules/asset/` — `POST /v1/assets/presign` and
       `POST /v1/assets/commit`, direct client-to-R2 upload
4. [ ] Build event albums — `ui/album.tsx`, backed by the `events` and `posts`
       tables
5. [ ] Build person-tagging — `ui/tag-picker.tsx`, pulling candidates from the
       tree, displaying the relation term next to each name
6. [ ] Build **voice comments** — `ui/voice-comment.tsx` in `shared/ui/`, used
       from Smriti first; hold-to-record, waveform playback. This is the
       feature that converts elders from passive viewers to contributors —
       see [01-PRODUCT.md §4.2](../01-PRODUCT.md#42-voice-comments--the-signature-feature-)
7. [ ] Build text comments and reactions
8. [ ] Build bulk import from the device gallery, wired into onboarding
       (workstream 1.10) — this is the single biggest lever on week-1
       "on this day" content
9. [ ] Implement `model/on-this-day.ts` — date-indexed resurfacing of past
       assets

**Definition of done:** 50 photos upload in the background over a throttled 3G
connection without blocking the UI, survive an app kill mid-upload, and resume
on reconnect.

---

## Workstream 1.5 — Katha

1. [ ] Build `ui/recorder.tsx` — up to 10 minutes, waveform, from
       `shared/ui/voice-button.tsx`
2. [ ] Build `ui/player.tsx` — scrub, speed control, background audio
3. [ ] Attach a story to a person, an event, or a photo
4. [ ] Build `ui/photo-story.tsx` — narrate over a slideshow of photos
5. [ ] **Delete** `video-katha-recorder.tsx` and `video-player.tsx` if they
       survived the Phase 0 restructure move — video is cut from scope
       ([ADR-0005](../adr/0005-no-video.md))

**Definition of done:** a 5-minute story records, uploads and plays back on a
second device with no audible quality complaint on a ₹12,000-class phone.

---

## Workstream 1.1 — Pravāha, the feed

Build this after 1.2–1.5 exist, since its job is to surface their content.

1. [ ] Build the feed screen at `app/(tabs)/index.tsx` — the app opens here,
       not on the tree ([ADR-0006](../adr/0006-feed-first.md))
2. [ ] Implement all 8 card types from
       [01-PRODUCT.md §2](../01-PRODUCT.md#2-the-home-screen--pravāha-p0):
       Today, On this day, new album, new story, tree change, invitation,
       weekly prompt, family milestone
3. [ ] Implement `server/src/modules/feed/` — `GET
    /v1/families/:id/feed?cursor=`, reverse-chronological with the Today
       card pinned
4. [ ] Cursor pagination and pull-to-refresh
5. [ ] Offline cache — the feed renders from local data with no network
6. [ ] **Guarantee the feed is never empty** — if there is no user content,
       Tithi and On-this-day fill it, and a brand-new family sees onboarding
       prompts instead of a blank screen. Treat an empty feed as a P0 bug in
       code review, not an edge case
7. [ ] Every card is actionable in one tap: react, voice-comment, or open

**Definition of done:** cold start to interactive feed under 1.5 seconds on a
Redmi-class device; the feed is never empty across every account state you can
construct, including a brand-new family with zero content.

---

## Workstream 1.6 — Jharokhā widget ⭐

See [01-PRODUCT.md §7](../01-PRODUCT.md#7-jharokhā--home-screen-widget-p1-)
for why this is worth building despite requiring native Android work.

1. [ ] Write the Expo config plugin in `modules/jharokha-widget/plugin.js`
2. [ ] Implement the native `AppWidgetProvider` in Kotlin
3. [ ] Build the 2×2 layout — latest family photo, tap to open
4. [ ] Build the 4×2 layout — today's occasion plus a one-tap voice wish
5. [ ] Build the 4×4 layout — four-photo mosaic plus the occasion strip
6. [ ] Implement the JS-to-widget data bridge in `modules/jharokha-widget/index.ts`
7. [ ] Trigger background refresh on new content
8. [ ] Prompt the user to add the widget after their first album is created

**Definition of done:** the widget reflects new content within a reasonable
background-refresh interval and survives a device reboot.

---

## Workstream 1.7 — Nimantraṇa

Currently AsyncStorage-only with zero API — this workstream gives it a real
backend for the first time.

1. [ ] Implement `server/src/modules/family/` invitation endpoints (or a
       dedicated `invitation` module) backed by Postgres
2. [ ] Build `ui/creator.tsx` — photo, text, date, venue, ceremony type
       (15 types), recipient selection **from the tree**
3. [ ] Build RSVP with a headcount
4. [ ] Implement reminders at one week and one day before, via the same push
       infrastructure as Tithi
5. [ ] Build the **public share link** — works for relatives without the app
       installed, previews correctly when pasted into WhatsApp

**Definition of done:** an invitation created on one device is received,
RSVP'd, and reminded correctly, and its share link opens and previews
correctly from a browser with the app not installed.

---

## Workstream 1.8 — Sharing and growth

1. [ ] Implement `server/src/modules/share/` — expiring, revocable, scoped
       (read or write) share tokens
2. [ ] Delete the client-side compressed (pako-deflate) share codes in the old
       `share-service.ts` — they were compression, not access control
3. [ ] Build QR and link sharing for the tree, with read or write scope
4. [ ] Build the join-request flow with steward approval
5. [ ] Build **WhatsApp share cards** — for albums, recaps, occasions, and
       invitations. Every card must render well in a WhatsApp link preview;
       see [06-ENGAGEMENT.md Layer 5](../06-ENGAGEMENT.md#layer-5--the-whatsapp-bridge-)
       — this is the entire acquisition channel at zero marketing budget
6. [ ] Build the weekly family recap card, designed to be shared

**Definition of done:** a share token expires and is revocable, verified by an
automated test; a WhatsApp share card renders a correct rich preview.

---

## Workstream 1.9 — Elder Path and languages

This is not a separate task at the end — apply it while building every UI
component above. It is listed here as a checklist to catch what was missed.

1. [ ] `shared/ui/text.tsx` enforces the 20pt minimum body size and is used
       everywhere instead of the raw RN `Text` (enforced by an ESLint rule
       from [03-CODEBASE-STRUCTURE.md §4](../03-CODEBASE-STRUCTURE.md#4-import-rules-enforced-by-eslint))
2. [ ] Every tap target across the app is audited to 48×48dp minimum
3. [ ] `shared/ui/voice-button.tsx` (hold-to-record) is the standard input for
       every comment, wish, and story — never a text-only fallback with no
       voice option
4. [ ] Onboarding is fully voice-narrated in the selected language
5. [ ] Migrate `src/i18n` → i18next with lazy-loaded namespaces
6. [ ] Add Tamil, Bengali, and Marathi (wave 2, per
       [01-PRODUCT.md §11.2](../01-PRODUCT.md#112-languages-p0--p5))
7. [ ] Bundle Noto Sans Indic fonts
8. [ ] Add the CI check that fails the build on a missing translation key

**Definition of done:** a person over 60, unfamiliar with the app, can record a
birthday wish and tag a photo using voice alone, in their own language, with
no typing.

---

## Workstream 1.10 — Onboarding and demo mode

Build last — it assembles everything above into the first-run experience.

1. [ ] Build the 7-step onboarding flow from
       [06-ENGAGEMENT.md §5](../06-ENGAGEMENT.md#5-the-onboarding-path):
       sign in → language → "who are you" → add parents/siblings → bulk
       photo import → record one voice story → invite via WhatsApp
2. [ ] Label demo/sample data with a persistent "Sample family — not your
       data" banner and a one-tap clear
3. [ ] Verify demo content never silently merges with real content — see
       [13-LESSONS.md L-0005](../13-LESSONS.md#l-0005--the-demo-data-that-looked-real)
       for what this looked like when it went wrong

**Definition of done:** a brand-new install, followed step by step, ends with
a usable tree, at least one photo, and one recorded voice story, in under 10
minutes.

---

## Phase 1 exit gate

- [ ] Cold start to interactive feed under 1.5s on a ₹12,000-class phone
- [ ] The feed is never empty, in every account state, including brand-new
- [ ] A birthday fires, a voice wish is recorded, and the recipient receives
      the aggregated card
- [ ] A tagged photo shows the correct kinship term in three languages, per
      viewer
- [ ] The widget reflects new content on the home screen
- [ ] Offline: three edits made with no connection converge correctly once
      back online (this is the sync layer from Phase 0, now exercised by real
      features)
- [ ] The 6 Maestro journeys from [08-SDLC.md](../08-SDLC.md#the-six-maestro-journeys)
      pass, including the offline-convergence journey
- [ ] Every `P0` row in [01-PRODUCT.md §12](../01-PRODUCT.md#12-feature--phase-matrix)
      is shipped

**When every box above is checked, open
[phase-2-family-testing.md](phase-2-family-testing.md).**
