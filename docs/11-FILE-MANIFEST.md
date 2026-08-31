# 11 · File Manifest

Every file that must exist in the finished product, with its purpose.
Status: `✅` exists · `🔄` exists, needs rewrite · `🆕` to be created ·
`❌` to be deleted

Use this as the build checklist. When a file is created, tick it.

---

## 1. Repository root

| File                                                               | Status | Purpose                                          |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------ |
| `package.json`                                                     | 🔄     | Version must match `app.json`                    |
| `app.json`                                                         | 🔄     | Rename to `app.sarvasvam`; fix the version       |
| `eas.json`                                                         | ✅     | Build profiles                                   |
| `tsconfig.json`                                                    | 🔄     | Add path aliases                                 |
| `eslint.config.js`                                                 | 🔄     | Add import-boundary zones                        |
| `jest.config.js`                                                   | 🔄     | Projects for client, server, e2e                 |
| `metro.config.js`                                                  | ✅     |                                                  |
| `tailwind.config.js`                                               | 🔄     | 20pt base type scale                             |
| `.env.example`                                                     | 🆕     | Documents every required variable                |
| `.gitignore`                                                       | 🔄     | Add `coverage/`, `.env`, `*.log`                 |
| `README.md`                                                        | 🔄     | Rewrite: what it is, how to run, link to `docs/` |
| `CHANGELOG.md`                                                     | ✅     | Keep the history                                 |
| `LICENSE`                                                          | ✅     |                                                  |
| `SRS.md`                                                           | ❌     | Superseded by `docs/`                            |
| `SHARING_SYSTEM_CHANGES.md`                                        | ❌     | Superseded                                       |
| `debug-layout.ts`, `debug-out.txt`, `logs.txt`, `fix-backticks.js` | ❌     | Working files                                    |
| `components/`, `hooks/`, `constants/` (root)                       | ❌     | Expo template leftovers                          |

## 2. Routes — `app/`

| File                    | Status | Purpose                                        |
| ----------------------- | ------ | ---------------------------------------------- |
| `_layout.tsx`           | 🔄     | Root providers, fonts, i18n, auth gate         |
| `(auth)/sign-in.tsx`    | 🆕     | Google Sign-In (replaces `login.tsx`)          |
| `(auth)/onboarding.tsx` | 🆕     | The 7-step flow                                |
| `(tabs)/_layout.tsx`    | 🔄     | Five tabs, 48dp targets, labels always visible |
| `(tabs)/index.tsx`      | 🔄     | **Pravāha feed**                               |
| `(tabs)/vriksha.tsx`    | 🔄     | Tree, under 100 lines                          |
| `(tabs)/smriti.tsx`     | 🔄     | Photos, 931 lines to under 100                 |
| `(tabs)/katha.tsx`      | 🔄     | Stories                                        |
| `(tabs)/more.tsx`       | 🆕     | Overflow (replaces `explore.tsx`)              |
| `member/[id].tsx`       | 🆕     | Person detail                                  |
| `album/[id].tsx`        | 🆕     | Album view                                     |
| `event/[id].tsx`        | 🆕     | Event view                                     |
| `occasion/[id].tsx`     | 🆕     | Tithi detail and wish collection               |
| `invite/[id].tsx`       | 🆕     | Invitation detail                              |
| `parampara/index.tsx`   | 🔄     | Off the tab bar                                |
| `vasiyat/index.tsx`     | 🔄     | Off the tab bar, flagged                       |
| `settings/index.tsx`    | 🔄     |                                                |
| `s/[token].tsx`         | 🆕     | Public share view, no auth                     |
| `modal.tsx`             | ❌     | Unused                                         |

## 3. Core — `src/core/`

| File                     | Status | Purpose                                    |
| ------------------------ | ------ | ------------------------------------------ |
| `db/client.ts`           | 🔄     | expo-sqlite handle, WAL, pragmas           |
| `db/schema.ts`           | 🆕     | Drizzle schema mirroring Postgres          |
| `db/migrations/*.sql`    | 🆕     | Local schema migrations                    |
| `sync/outbox.ts`         | 🆕     | Enqueue, dequeue, poison handling          |
| `sync/push.ts`           | 🆕     | Batch push, idempotent                     |
| `sync/pull.ts`           | 🆕     | Cursor pull, apply change_log              |
| `sync/worker.ts`         | 🔄     | Scheduling, backoff, connectivity          |
| `sync/conflict.ts`       | 🆕     | Last-write-wins rules                      |
| `api/client.ts`          | 🔄     | fetch wrapper, auth header, retry          |
| `api/endpoints.ts`       | 🆕     | Typed endpoint constants                   |
| `api/errors.ts`          | 🆕     | Error taxonomy                             |
| `auth/google.ts`         | 🆕     | Google Sign-In                             |
| `auth/session.ts`        | 🆕     | Session state                              |
| `auth/tokens.ts`         | 🆕     | Secure token storage and refresh           |
| `auth/biometrics.ts`     | 🔄     | Optional app lock                          |
| `media/pipeline.ts`      | 🔄     | Resize, WebP, thumbnail                    |
| `media/upload-queue.ts`  | 🆕     | Resumable background upload                |
| `media/audio.ts`         | 🆕     | Record, encode, playback                   |
| `storage/kv.ts`          | 🔄     | AsyncStorage wrapper — preferences only    |
| `storage/secure.ts`      | 🔄     | expo-secure-store wrapper                  |
| `notifications/index.ts` | 🔄     | Expo Push registration and handling        |
| `links/index.ts`         | 🔄     | Deep links and share links                 |
| `privacy/export.ts`      | 🆕     | DPDP data export                           |
| `privacy/erasure.ts`     | 🆕     | Account deletion                           |
| `logging/logger.ts`      | 🔄     | Structured logging                         |
| `logging/sentry.ts`      | 🔄     | Sentry init                                |
| `config/env.ts`          | 🔄     | Typed, validated env — **no hardcoded IP** |
| `config/flags.ts`        | 🆕     | Feature flags                              |
| `types/entities.ts`      | 🔄     | Member, Relation, Post, Asset, Comment     |
| `types/ids.ts`           | 🆕     | Branded ID types                           |
| `encryption.ts`          | ❌     | **XOR posing as AES — delete**             |
| `cache.ts`               | ❌     | TanStack Query owns caching                |
| `offline-db.web.ts`      | ❌     | No web target                              |

## 4. Shared — `src/shared/`

| File                                                        | Status | Purpose                                                                 |
| ----------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| `ui/text.tsx`                                               | 🆕     | **Enforces the 20pt Elder Path minimum.** Replaces RN `Text` everywhere |
| `ui/button.tsx`                                             | 🔄     | 48dp minimum; from `silk-button.tsx`                                    |
| `ui/card.tsx`                                               | 🔄     | From `heritage-card.tsx`                                                |
| `ui/sheet.tsx`                                              | 🆕     | Bottom sheet primitive                                                  |
| `ui/avatar.tsx`                                             | 🔄     | From `member-avatar.tsx`                                                |
| `ui/voice-button.tsx`                                       | 🆕     | **Hold to record. Used on every surface**                               |
| `ui/waveform.tsx`                                           | 🔄     | From `voice-waveform.tsx`                                               |
| `ui/skeleton.tsx`                                           | ✅     |                                                                         |
| `ui/loading-spinner.tsx`                                    | ✅     |                                                                         |
| `ui/error-boundary.tsx`                                     | ✅     |                                                                         |
| `ui/error-display.tsx`                                      | ✅     |                                                                         |
| `ui/offline-banner.tsx`                                     | ✅     |                                                                         |
| `ui/empty-state.tsx`                                        | 🆕     | Every list needs one                                                    |
| `ui/sacred-text.tsx`                                        | ✅     | Decorative Devanagari                                                   |
| `ui/index.ts`                                               | 🆕     | Barrel                                                                  |
| `theme/{colors,spacing,typography,animations}.ts`           | 🔄     | 20pt base scale                                                         |
| `i18n/index.ts`                                             | 🔄     | **Rewrite on i18next**                                                  |
| `i18n/use-language.tsx`                                     | 🔄     |                                                                         |
| `i18n/locales/{en,hi,te,ta,bn,mr}/*.json`                   | 🔄     | Namespaced, lazy-loaded                                                 |
| `i18n/kinship/{en,hi,te,ta,...}.json`                       | 🆕     | **The kinship term database** ⭐                                        |
| `hooks/use-animations.ts`                                   | ✅     |                                                                         |
| `hooks/use-pull-to-refresh.ts`                              | ✅     |                                                                         |
| `hooks/use-debounce.ts`                                     | 🆕     |                                                                         |
| `utils/{date,ids,validation,accessibility,lazy-loading}.ts` | ✅     |                                                                         |

## 5. Features — `src/features/`

Each feature has `ui/`, `hooks/`, `model/`, `repo/`, `store.ts`, `index.ts`.

| Feature        | Key files                                                                | Status                                 |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------- |
| **pravaha**    | `ui/feed.tsx`, `ui/cards/*.tsx` (8 card types), `repo/feed-repo.ts`      | 🆕                                     |
| **vriksha**    | `model/graph.ts`, `model/layout/{rank,order,position,route}.ts`          | 🔄 rewrite                             |
|                | `model/kinship/{resolver,path,rules}.ts`                                 | 🔄                                     |
|                | `model/gedcom/{parse,serialise}.ts`                                      | 🆕                                     |
|                | `ui/tree-canvas.tsx` (Skia), `ui/member-node.tsx`, `ui/edges.tsx`        | 🔄                                     |
|                | `ui/{member-sheet,add-member,share-sheet,import-sheet,join-request}.tsx` | 🔄                                     |
|                | `repo/{member,relation,share}-repo.ts`                                   | 🆕                                     |
| **smriti**     | `ui/{gallery,album,upload,viewer,mosaic,timeline}.tsx`                   | 🔄                                     |
|                | `ui/voice-comment.tsx` ⭐                                                | 🆕                                     |
|                | `model/on-this-day.ts`                                                   | 🆕                                     |
|                | `repo/{asset,album,comment}-repo.ts`                                     | 🆕                                     |
| **katha**      | `ui/{recorder,player,photo-story}.tsx`                                   | 🔄                                     |
|                | `ui/video-*.tsx`                                                         | ❌ no video                            |
| **tithi** ⭐   | `model/occasions.ts` (birthdays, anniversaries, punya tithi)             | 🆕                                     |
|                | `model/festivals.ts`                                                     | 🆕                                     |
|                | `ui/{occasion-card,wish-recorder,wish-collection}.tsx`                   | 🆕                                     |
|                | `repo/occasion-repo.ts`                                                  | 🆕                                     |
| **nimantrana** | `ui/{creator,detail,list}.tsx`                                           | 🔄                                     |
|                | `repo/invitation-repo.ts`                                                | 🆕 **first real backend**              |
| **parampara**  | `ui/{creator,detail,list}.tsx`                                           | ✅                                     |
| **vasiyat**    | `ui/{creator,viewer,vault}.tsx`                                          | ✅ flagged off                         |
|                | `model/crypto.ts`                                                        | 🆕 **real encryption before shipping** |
| **onboarding** | `ui/flow.tsx`, `model/demo-family.ts`                                    | 🔄                                     |
| **settings**   | `ui/settings.tsx`, `ui/language-selector.tsx`                            | ✅                                     |
| **search**     | `ui/search.tsx`, `model/search.ts`                                       | 🔄 **replace the mock results**        |

## 6. Native — `modules/`

| File                                             | Status | Purpose                           |
| ------------------------------------------------ | ------ | --------------------------------- |
| `jharokha-widget/plugin.js`                      | 🆕     | Expo config plugin                |
| `jharokha-widget/android/.../SarvasvamWidget.kt` | 🆕     | `AppWidgetProvider`               |
| `jharokha-widget/android/.../widget_*.xml`       | 🆕     | 2×2, 4×2, 4×4 layouts             |
| `jharokha-widget/index.ts`                       | 🆕     | JS bridge for pushing widget data |

## 7. Server — `server/src/`

| File                                                        | Status | Purpose                              |
| ----------------------------------------------------------- | ------ | ------------------------------------ |
| `index.ts`, `app.ts`                                        | 🔄     | Bootstrap, split from routing        |
| `config/index.ts`                                           | 🔄     | Typed env                            |
| `db/client.ts`                                              | 🔄     | **Postgres**, was MySQL              |
| `db/schema.ts`                                              | 🆕     | Drizzle schema                       |
| `db/migrations/*`                                           | 🔄     | Ported to Postgres                   |
| `middleware/{auth,error-handler,logger,security,upload}.ts` | ✅     |                                      |
| `middleware/tenancy.ts`                                     | 🆕     | **Injects `family_id` from the JWT** |
| `modules/auth/*`                                            | 🔄     | Google ID token verification         |
| `modules/family/*`                                          | 🔄     | Families, memberships, join requests |
| `modules/member/*`                                          | 🔄     | Members and relations                |
| `modules/asset/*`                                           | 🆕     | R2 presign and commit                |
| `modules/feed/*`                                            | 🆕     | Feed query                           |
| `modules/tithi/*`                                           | 🆕     | Occasion query ⭐                    |
| `modules/sync/*`                                            | 🆕     | Push and pull                        |
| `modules/share/*`                                           | 🆕     | Tokens, public share view            |
| `modules/privacy/*`                                         | 🆕     | Export and erasure                   |
| `lib/{logger,sentry,r2,gedcom}.ts`                          | 🔄     |                                      |
| `services/gemini.service.ts`                                | ❌     | Deferred AI                          |
| `mock-server.ts`                                            | ❌     | Superseded                           |

## 8. Tests

| Path                                                                  | Purpose                                         |
| --------------------------------------------------------------------- | ----------------------------------------------- |
| `src/features/vriksha/model/layout/__tests__/`                        | Golden fixtures, crossings, cycles, perf        |
| `src/features/vriksha/model/kinship/__tests__/`                       | 200 path-to-term pairs, per language            |
| `src/features/tithi/model/__tests__/`                                 | A full year of occasions for a 30-member family |
| `src/core/sync/__tests__/`                                            | Outbox, idempotency, LWW, poisoned ops          |
| `server/src/modules/*/__tests__/`                                     | Every endpoint, especially cross-tenant auth    |
| `e2e/*.yaml`                                                          | The 6 Maestro journeys                          |
| `src/__tests__/debug_*.ts`, `reproduce_issue.ts`, `test_inversion.ts` | ❌ delete                                       |

## 9. Docs and ops

| File                            | Status                                 |
| ------------------------------- | -------------------------------------- |
| `docs/00` … `docs/14`           | ✅ this set                            |
| `docs/RUNBOOK.md`               | 🆕 deploy, rollback, restore, rotate   |
| `docs/adr/*.md`                 | 🆕 one per hard decision               |
| `.github/workflows/ci.yml`      | 🔄 typecheck, lint, test, i18n, build  |
| `.github/workflows/release.yml` | 🆕 signed AAB                          |
| `scripts/gen-eslint-zones.mjs`  | 🆕 generates cross-feature import bans |
| `scripts/check-i18n.mjs`        | 🆕 fails CI on a missing key           |
| `scripts/check-versions.mjs`    | 🆕 `app.json` matches `package.json`   |
