# Phase 0 · Foundation

|                |                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| **Objective**  | Stop the bleeding, get off the laptop, restructure the codebase into a shape that can absorb six months of work |
| **Window**     | Weeks 1–3 (3 weeks at 21–24 hrs/week ≈ 65–72 hours)                                                             |
| **Depends on** | Nothing. Start here                                                                                             |
| **Unlocks**    | Phase 1 — nothing in Phase 1 is safe to build on the current foundation                                         |

---

## Why this phase exists, and why it is not a feature phase

Three things are true about the app right now, verified directly against the
code and a live database probe:

1. **The Firebase database is publicly readable.** Anyone can enumerate every
   family and read its members and relations. No harm yet — only a test tree
   exists — but the first real family changes that.
2. **The codebase has three data planes that never reconcile** — AsyncStorage
   plus Firebase for the tree, MySQL for content, AsyncStorage-only for
   invitations. No feature in [01-PRODUCT.md](../01-PRODUCT.md) that makes this
   product different from a generic photo app is buildable until there is one
   data plane.
3. **Code is organised by file type, not by feature**, so a single feature is
   smeared across six directories and any file can import any other. Every
   hour spent adding features to this structure is an hour that gets rewritten
   later, at a worse time, under more pressure.

**Nothing in this phase is user-visible.** That is deliberate — it is the one
phase where "no new features" is correct, not a failure to ship.

**Rule for the whole phase, from [03-CODEBASE-STRUCTURE.md §7](../03-CODEBASE-STRUCTURE.md#7-execution-order):
no behaviour changes are bundled with structural moves.** A commit that moves a
file and a commit that rewrites its logic are two different commits. This is
what keeps every step revertible.

---

## Workstream 0.1 — Security first, this week

Do this before anything else in the phase. It is a few hours of work fixing a
critical, live exposure — see [07-SECURITY-PRIVACY.md §2](../07-SECURITY-PRIVACY.md#2-s1--firebase-the-urgent-one)
for the full finding.

1. [ ] Log into the Firebase console for project `vansh-f88c2`
2. [ ] Set Realtime Database rules to `{"rules":{".read":false,".write":false}}`
       and publish immediately
3. [ ] Rotate the Firebase Web API key; restrict the new key by Android package
       name and SHA-1 certificate fingerprint
4. [ ] Confirm the fix from an unauthenticated machine:
       `curl https://vansh-f88c2-default-rtdb.firebaseio.com/trees.json` must
       now return a permission-denied error
5. [ ] Delete `src/config/firebase.ts` and remove `firebase` from
       `package.json`
6. [ ] Search the full git history for the committed key and scrub it with
       `git filter-repo` (or accept the key as permanently burned and rely
       entirely on rotation plus restriction — filter-repo rewrites history,
       which is destructive; confirm before running it)
7. [ ] Delete `src/services/encryption.ts` — it declares AES-256-GCM but
       performs XOR. It is called nowhere today, so deleting it breaks nothing.
       See [13-LESSONS.md L-0001](../13-LESSONS.md#l-0001--the-encryption-that-was-not-encryption)
8. [ ] Grep the repo for any other committed secret: `git grep -iE
    "apiKey|secret|password" -- '*.ts' '*.tsx'`

**Exit check for this workstream:** the Firebase RTDB returns permission-denied
to an anonymous read, and `git grep -i firebase` returns nothing outside this
checklist's own history.

---

## Workstream 0.2 — Naming

Do this early — the package name and domain are referenced by config changes
throughout the rest of the phase.

1. [ ] Verify **Sarvasvam** is clear: Play Store search, App Store search,
       `sarvasvam.app` domain availability, Indian trademark classes 9 and 42.
       See [README.md](../README.md#naming) for why the short form is
       Sarvasvam and not Parivāra
2. [ ] Register `sarvasvam.app` if clear
3. [ ] Change the Android package identifier to `app.sarvasvam` in `app.json`
4. [ ] Replace every "Vansh" string in code, UI copy, and asset filenames:
       `git grep -il vansh` and go through the list
5. [ ] Rename the Expo project slug and EAS project if one exists
6. [ ] Confirm: `git grep -i vansh` returns nothing except `CHANGELOG.md`
       history entries

---

## Workstream 0.3 — Codebase restructure

Follow the nine-commit sequence in
[03-CODEBASE-STRUCTURE.md §7](../03-CODEBASE-STRUCTURE.md#7-execution-order)
exactly — it is ordered so every commit leaves the app buildable. Run
`npx tsc --noEmit` and `npm test` after each one; do not proceed on red.

1. [ ] **Commit 1 — delete dead code.** Everything in
       [03-CODEBASE-STRUCTURE.md §6.6](../03-CODEBASE-STRUCTURE.md#66-repository-root--delete-on-sight):
       `*-old.tsx` files, `debug-layout.ts`, `debug-out.txt`, `logs.txt`,
       `fix-backticks.js`, `scripts/apply-ego-centric-layout.js`,
       `src/__tests__/debug_*.ts`, `reproduce_issue.ts`, `test_inversion.ts`,
       root-level `components/` `hooks/` `constants/` (Expo template
       leftovers shadowed by `src/`), `coverage/`. Nothing else touched
2. [ ] **Commit 2 — scaffold the structure.** Create empty `core/`, `shared/`,
       `features/*/{ui,hooks,model,repo}` directories with `index.ts` stubs.
       Add path aliases to `tsconfig.json`
       ([03-CODEBASE-STRUCTURE.md §5](../03-CODEBASE-STRUCTURE.md#5-path-aliases)).
       Add the ESLint import-boundary zones
       ([03-CODEBASE-STRUCTURE.md §4](../03-CODEBASE-STRUCTURE.md#4-import-rules-enforced-by-eslint))
       set to `warn`, not `error`, yet
3. [ ] **Commit 3 — move `core/`.** Services listed in
       [03-CODEBASE-STRUCTURE.md §6.4](../03-CODEBASE-STRUCTURE.md#64-shared-and-core)
       move mechanically into `core/*`; fix every import. This is the biggest
       pure-mechanical commit — expect it to touch the most files with the
       least judgement required
4. [ ] **Commit 4 — move `shared/`.** Components, theme, i18n scaffolding,
       hooks and utils per the same table
5. [ ] **Commit 5 — split `src/state/stores.ts`.** The nine-store monolith
       becomes one `store.ts` per feature. Do this before moving features so
       each feature move in the next commit is self-contained
6. [ ] **Commit 6 — move features, one commit per feature.** Order:
       `settings`, `onboarding`, `parampara`, `nimantrana`, `vasiyat`,
       `katha`, `smriti`, `vriksha` (last and largest — see
       [03-CODEBASE-STRUCTURE.md §6.2](../03-CODEBASE-STRUCTURE.md#62-vriksha--the-tree)
       for its specific file-by-file map)
7. [ ] **Commit 7 — thin the routes.** Pull logic out of every
       `app/(tabs)/*.tsx` file until each is under 100 lines and contains only
       routing and layout. `smriti.tsx` goes from 931 lines to under 100 —
       this is the single largest line-count reduction in the phase
8. [ ] **Commit 8 — rename `backend/` to `server/`,** slice controllers and
       routes into `modules/<name>/` per
       [03-CODEBASE-STRUCTURE.md §6.5](../03-CODEBASE-STRUCTURE.md#65-server)
9. [ ] **Commit 9 — flip ESLint zones to `error`.** CI now fails on any
       cross-feature import or any `core`/`shared` file reaching upward
10. [ ] Fix the `ceremonyDate` type error at `app/(tabs)/index.tsx:51`
        (`Property 'ceremonyDate' does not exist on type 'Nimantran'`) — this
        has been sitting broken since before this document set existed and
        blocks a clean `tsc --noEmit`

**Exit check for this workstream:** `npx tsc --noEmit`, `npx eslint .`, and
`npm test` are all clean; no file exceeds 400 lines; no route file exceeds 100.

---

## Workstream 0.4 — Data layer

This is the workstream that turns three data planes into one. See
[02-ARCHITECTURE.md §3–4](../02-ARCHITECTURE.md#3-data-model-postgres-17) for
the full schema and sync design — this checklist is the build order.

1. [ ] Provision a Neon Postgres 17 project (free tier)
2. [ ] Write the Drizzle schema from
       [02-ARCHITECTURE.md §3.1](../02-ARCHITECTURE.md#31-core-tables) —
       `users`, `families`, `family_memberships`, `members`, `relations`,
       `events`, `assets`, `posts`, `post_assets`, `tags`, `comments`,
       `reactions`, `change_log`
3. [ ] Add every index from
       [02-ARCHITECTURE.md §3.2](../02-ARCHITECTURE.md#32-required-indexes),
       including the Tithi month/day expression index — this one query is
       what makes the whole occasion engine in Phase 1 fast
4. [ ] Write and run the migration: MySQL schema and data → Postgres. Verify
       row counts match on every table before deleting the MySQL instance
5. [ ] Rewrite `server/src/db/client.ts` on the Postgres driver; delete
       `mysql2` from `package.json`
6. [ ] Rewrite the client local database on `expo-sqlite` + Drizzle, mirroring
       the server schema
7. [ ] Build `core/sync/outbox.ts` — enqueue and dequeue, with the poison-op
       handling described in
       [02-ARCHITECTURE.md §4.1](../02-ARCHITECTURE.md#41-the-outbox-pattern)
8. [ ] Build `core/sync/push.ts` and `pull.ts` — idempotent push keyed by
       `op_id`, cursor-based pull keyed by `change_log.seq`
9. [ ] Build `core/sync/worker.ts` — triggers on connectivity change, app
       foreground, and a 15-minute background task; exponential backoff
       capped at 5 minutes
10. [ ] Implement the last-write-wins rules from
        [02-ARCHITECTURE.md §4.2](../02-ARCHITECTURE.md#42-conflict-resolution)
11. [ ] Delete `src/features/vriksha/tree-sync-service.ts` — the tree now
        syncs through `core/sync` like everything else
12. [ ] **Verify: `git grep -rn "AsyncStorage" src/features` returns no entity
        writes** — AsyncStorage is preferences-only from this point forward

**Exit check for this workstream:** two devices can each add a different
member to the same family while offline, come back online, and both members
exist on both devices afterward with no data loss.

---

## Workstream 0.5 — Deploy

1. [ ] Create the Oracle Cloud Always Free ARM VM (Ampere A1)
2. [ ] Install Node 22, Caddy, and PM2 on the VM
3. [ ] Point `api.sarvasvam.app` at the VM; let Caddy issue TLS automatically
4. [ ] Deploy the server; confirm `GET /health` responds `200` over HTTPS from
       outside the VM
5. [ ] Create the Cloudflare R2 bucket; confirm a presigned PUT and a
       subsequent GET both work from a script, before wiring it into the app
6. [ ] Wire Sentry on both the client and the server, with release tagging
7. [ ] **Remove the hardcoded LAN IP `172.16.3.35`** from `src/config/api.ts`
       (now `core/config/env.ts`) — replace with an environment-driven base
       URL that defaults to the deployed API
8. [ ] Write `docs/RUNBOOK.md` sections 2 (deploy) and 6 (rotate a secret) as
       you actually perform each step for the first time — do not write them
       from memory afterward

**Exit check for this workstream:** the app, installed on a phone on mobile
data with Wi-Fi off, successfully reaches the deployed API.

---

## Workstream 0.6 — Auth

1. [ ] Register the app in Google Cloud Console; obtain OAuth client IDs for
       Android and the server
2. [ ] Implement `core/auth/google.ts` on the client — Google Sign-In, no
       phone OTP (see [ADR-0008](../adr/0008-google-signin-only.md) for why)
3. [ ] Implement `server/src/modules/auth/` — verify the Google ID token
       against Google's JWKS, issue a first-party JWT
4. [ ] Implement access-token issue (15 min) and refresh-token rotation
       (30 days, revocable)
5. [ ] Store tokens via `core/storage/secure.ts` (`expo-secure-store`,
       Android Keystore-backed) — never AsyncStorage
6. [ ] Implement `server/src/middleware/tenancy.ts` — every downstream
       handler receives `family_id` from the verified JWT, never from the
       request body
7. [ ] Write the cross-tenant authorisation test now, even though there is
       only one endpoint to test against — it is the template every later
       endpoint copies: **a user in family A gets a 403 reading family B**

**Exit check for this workstream:** sign-in works end to end on a real device,
and the cross-tenant test passes.

---

## Workstream 0.7 — Hygiene

1. [ ] Wire GitHub Actions CI: typecheck → lint → unit tests → server tests →
       i18n key check → APK build
2. [ ] Add a CI check that `app.json` version and `package.json` version
       match, and that `versionCode`/`version` increments — they disagree
       today (1.0.0 vs 2.0.0) and this must not regress silently
3. [ ] Add `coverage/`, `.env`, `*.log` to `.gitignore` if not already covered
4. [ ] Correct `docs/ppt/build_vansh_pitch_deck.py`: remove the false
       "AES-256-GCM" / "bank-level protection" claim (slide 9) and the false
       "no direct competitor" claim (slide 13) — see
       [12-BUSINESS.md §7](../12-BUSINESS.md#7-the-pitch-deck--what-to-fix)
       for the exact replacement text
5. [ ] Mark `SRS.md` deprecated with a one-line banner pointing at `docs/`, or
       delete it once you have confirmed nothing else references it

---

## Phase 0 exit gate

Every box below must be checked before Phase 1 work starts. An unfinished
Phase 0 item becomes a much more expensive bug once features are built on top
of it.

- [ ] The app runs against the deployed API from a phone on mobile data, with
      Wi-Fi off
- [ ] Firebase RTDB denies an anonymous read; `firebase` is not a dependency
- [ ] `encryption.ts` (XOR-as-AES) is deleted
- [ ] `npx tsc --noEmit`, `npx eslint .`, and `npm test` are all clean, with
      import-boundary zones set to `error`
- [ ] No file exceeds 400 lines; no route file exceeds 100
- [ ] Two devices edit the same tree offline and converge with no data loss
      on reconnect
- [ ] Sign in with Google, add a member, upload a photo — all work end to end
      on real hardware, against the deployed server
- [ ] The `ceremonyDate` type error is fixed
- [ ] `app.json` and `package.json` versions match, enforced by CI
- [ ] `git grep -i vansh` returns only `CHANGELOG.md` history
- [ ] The pitch deck no longer claims AES-256-GCM or "no competitor"
- [ ] `docs/RUNBOOK.md` sections 2 and 6 are written from having actually
      performed the steps, not from memory

**When every box above is checked, open
[phase-1-habit-loop.md](phase-1-habit-loop.md).**
